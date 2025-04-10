import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { getWallboxes } from '@/api/cfos';
import { MEMBERSHIP_ID_NOBODY } from '@/constants';
import { startChargingSession, stopChargingSession } from '@/services/chargingSessionService';
import type { GetWallboxesResponse } from '@/types/zod/cfos';
import { CobotMembershipId } from '@/types/zod/cobotApi';

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
    .input(z.object({ chargerId: z.string(), membershipId: CobotMembershipId.or(z.literal(MEMBERSHIP_ID_NOBODY)) }))
    .mutation(async ({ ctx, input }) => {
        const result = await startChargingSession(
            ctx.userDetails,
            ctx.cobotSpaceSettings,
            input.chargerId,
            input.membershipId,
        );
        if (!result.ok) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: `Error starting charging: ${result.error}`,
            });
        }
        return result.value;
    });

export const stopCharging = adminProcedure
    .input(z.object({ chargerId: z.string() }))
    .mutation(async ({ ctx, input }) => {
        // TODO update charging session in database
        const result = await stopChargingSession(ctx.userDetails, ctx.cobotSpaceSettings, input.chargerId);
        if (!result.ok) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: `Error stopping charging: ${result.error}`,
            });
        }
        return result.value;
    });
