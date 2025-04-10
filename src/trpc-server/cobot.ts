import { TRPCError } from '@trpc/server';

import { listMembershipsWithIdNameEmail, listResources } from '@/api/cobot';
import { adminProcedure } from '@/trpc-server/base';
import type { CobotApiResponseGetMemberships } from '@/types/zod/cobotApi';

export const getMemberships = adminProcedure.query(async ({ ctx }): Promise<CobotApiResponseGetMemberships> => {
    const result = await listMembershipsWithIdNameEmail(ctx.cobotSpaceSettings.accessToken, ctx.spaceSubdomain);
    if (!result.ok) {
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Error fetching Memberships for Cobot space: ${result.error}`,
        });
    }
    return result.value;
});

export const getResources = adminProcedure.query(async ({ ctx }) => {
    const result = await listResources(ctx.cobotSpaceSettings.accessToken, ctx.spaceSubdomain);
    if (!result.ok) {
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Error fetching Resources for Cobot space: ${result.error}`,
        });
    }
    return result.value;
});
