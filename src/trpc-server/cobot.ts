import { TRPCError } from '@trpc/server';

import { listMembershipsWithIdNameEmail } from '@/api/cobot';
import { adminProcedure } from '@/trpc-server/base';
import type { CobotApiResponseGetMemberships } from '@/types/zod';

export const getMemberships = adminProcedure.query(async ({ ctx }): Promise<CobotApiResponseGetMemberships> => {
    const result = await listMembershipsWithIdNameEmail(ctx.cobotSpaceAccessToken, ctx.spaceSubdomain);
    if (!result.ok) {
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Error fetching Wallbox status: ${result.error}`,
        });
    }
    return result.value;
});
