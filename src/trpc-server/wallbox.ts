import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { cfosDeauthorizeWallbox, type GetWallboxesResponse } from '@/api/cfos';
import { cfosAuthorizeWallbox, getWallboxes } from '@/api/cfos';
import { CobotMembershipId } from '@/types/zod';

import { adminProcedure } from './base';

export const getWallboxStatus = adminProcedure.query(async ({ ctx }): Promise<GetWallboxesResponse> => {
    const result = await getWallboxes();
    if (!result.ok) {
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Error fetching Wallbox status: ${result.error}`,
        });
    }
    return result.value;
});

export const startCharging = adminProcedure
    .input(z.object({ id: z.string(), membershipId: CobotMembershipId.nullable() }))
    .mutation(async ({ ctx, input }) => {
        // TODO store charging session in database
        const result = await cfosAuthorizeWallbox(input.id);
        if (!result.ok) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: `Error starting charging: ${result.error}`,
            });
        }
        return result.value;
    });

export const stopCharging = adminProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    // TODO update charging session in database
    const result = await cfosDeauthorizeWallbox(input.id);
    if (!result.ok) {
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Error stopping charging: ${result.error}`,
        });
    }
    return result.value;
});
