import { initTRPC, TRPCError } from '@trpc/server';
import type { CreateNextContextOptions } from '@trpc/server/adapters/next';

import { getUserDetails } from '@/api/cobot';
import { unsealIframeToken } from '@/seals';
import { spaceAccessTokenStore } from '@/storage';
import type { CobotApiResponseGetUserDetails, CobotSpaceAccessToken } from '@/types/zod';

const authorizationHeaderPrefix = 'bearer ';

export type TrpcContext = {
    spaceId: string;
    spaceSubdomain: string;
    cobotUserId: string;
    cobotAccessToken: string;
    cobotSpaceAccessToken: CobotSpaceAccessToken['accessToken'];
    userDetails: CobotApiResponseGetUserDetails;
    isMember: boolean;
    isAdmin: boolean;
};

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

    const { spaceId, spaceSubdomain, cobotUserId, cobotAccessToken } = iframeTokenUnsealResult.value;

    const cobotSpaceAccessToken = await spaceAccessTokenStore.get({ spaceId });
    if (!cobotSpaceAccessToken.ok || !cobotSpaceAccessToken.value) {
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Missing space access token',
        });
    }

    const userDetails = await getUserDetails(cobotAccessToken);
    if (!userDetails.ok) {
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid access token',
        });
    }
    console.log(userDetails);
    const isMember = userDetails.value.memberships.some(({ id }) => id === spaceId);
    const isAdmin = userDetails.value.admin_of.some(({ space_subdomain }) => space_subdomain === spaceSubdomain);

    return {
        spaceId,
        spaceSubdomain,
        cobotUserId,
        cobotAccessToken,
        cobotSpaceAccessToken: cobotSpaceAccessToken.value.accessToken,
        userDetails: userDetails.value,
        isMember,
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
    if (!ctx.isMember) {
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'You are not a member',
        });
    }
    return await next({ ctx });
});
