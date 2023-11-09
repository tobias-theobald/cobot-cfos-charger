import { initTRPC, TRPCError } from '@trpc/server';
import type { CreateNextContextOptions } from '@trpc/server/adapters/next';
import { unsealIframeToken } from '../seals';
import type { IframeToken } from '../types/zod';

const authorizationHeaderPrefix = 'bearer ';

export const createContext = async (opts: CreateNextContextOptions): Promise<IframeToken> => {
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

    return iframeTokenUnsealResult.value;
};

// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.context<typeof createContext>().create();

// Base router and procedure helpers
export const router = t.router;
export const procedure = t.procedure;
