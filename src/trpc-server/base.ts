import { initTRPC, TRPCError } from '@trpc/server';
import type { CreateNextContextOptions } from '@trpc/server/adapters/next';

import { getUserDetails } from '@/api/cobot';
import { USER_DETAILS_CACHE_TTL_MS } from '@/constants';
import { unsealIframeToken } from '@/seals';
import { spaceSettingsStore } from '@/storage';
import type { CobotApiResponseGetUserDetails } from '@/types/zod/cobotApi';
import type { CobotSpaceSettings } from '@/types/zod/other';

const authorizationHeaderPrefix = 'bearer ';

export type TrpcContext = {
    spaceId: string;
    spaceSubdomain: string;
    cobotUserId: string;
    cobotUserAccessToken: string;
    cobotSpaceSettings: CobotSpaceSettings;
    userDetails: CobotApiResponseGetUserDetails;
    spaceMembershipId: string | null;
    isAdmin: boolean;
};

export const userDetailsCache = new Map<string, [number, CobotApiResponseGetUserDetails]>();

export const createContext = async (opts: CreateNextContextOptions): Promise<TrpcContext> => {
    const authorizationHeader = opts.req.headers.authorization;
    if (
        typeof authorizationHeader !== 'string' ||
        !authorizationHeader.toLowerCase().startsWith(authorizationHeaderPrefix)
    ) {
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Missing authorization header',
        });
    }
    const iframeToken = authorizationHeader.slice('bearer '.length);
    const iframeTokenUnsealResult = await unsealIframeToken(iframeToken);
    if (!iframeTokenUnsealResult.ok) {
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid authorization header',
        });
    }

    const { spaceId, spaceSubdomain, cobotUserId, cobotUserAccessToken } = iframeTokenUnsealResult.value;

    const cobotSpaceSettings = await spaceSettingsStore.get({ spaceId });
    if (!cobotSpaceSettings.ok || !cobotSpaceSettings.value) {
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Missing space access token',
        });
    }

    // This is a balancing act between security and performance. This does constitute a security check and caching it
    // means the user could theoretically be using their credentials past when they were kicked from the space.
    // But I think 60s is a good balance here.
    let userDetailsResult = null;
    // See if we have the user details in the cache
    if (userDetailsCache.has(cobotUserId)) {
        const [expirationTime, userDetails] = userDetailsCache.get(cobotUserId)!;
        if (Date.now() < expirationTime) {
            userDetailsResult = userDetails;
        } else {
            userDetailsCache.delete(cobotUserId);
        }
    }

    if (userDetailsResult === null) {
        const userDetails = await getUserDetails(cobotUserAccessToken);
        if (!userDetails.ok) {
            throw new TRPCError({
                code: 'UNAUTHORIZED',
                message: 'Invalid access token',
            });
        }
        userDetailsResult = userDetails.value;

        // Cache the user details
        userDetailsCache.set(cobotUserId, [Date.now() + USER_DETAILS_CACHE_TTL_MS, userDetails.value]);
    }

    const spaceMembership = userDetailsResult.memberships.find(
        ({ space_subdomain }) => space_subdomain === spaceSubdomain,
    );
    const spaceMembershipId = spaceMembership?.id ?? null;
    const isAdmin = userDetailsResult.admin_of.some(({ space_subdomain }) => space_subdomain === spaceSubdomain);

    return {
        spaceId,
        spaceSubdomain,
        cobotUserId,
        cobotUserAccessToken,
        cobotSpaceSettings: cobotSpaceSettings.value,
        userDetails: userDetailsResult,
        spaceMembershipId,
        isAdmin,
    };
};

// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.context<typeof createContext>().create();

// Base router and procedure helpers
export const router = t.router;

export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
    if (!ctx.isAdmin) {
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'You are not an admin',
        });
    }
    return await next({ ctx });
});
export const memberProcedure = t.procedure.use(async ({ ctx, next }) => {
    if (!ctx.spaceMembershipId) {
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'You are not a member',
        });
    }
    return await next({ ctx });
});
