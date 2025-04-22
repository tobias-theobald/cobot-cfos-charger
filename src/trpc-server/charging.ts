import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { cfosAuthorizeWallbox, cfosDeauthorizeWallbox, getWallboxes } from '@/api/cfos';
import { MEMBERSHIP_ID_NOBODY } from '@/constants';
import { startChargingSession, stopChargingSession } from '@/services/chargingControlService';
import { getCurrentChargingSessions, getHistoricChargingSessions } from '@/services/chargingSessionService';
import type { WallboxStatusWithChargingSession } from '@/types/trpc';
import { CobotMembershipId } from '@/types/zod/cobotApi';

import { adminProcedure } from './base';

export const getWallboxesStatusWithChargingSession = adminProcedure.query(
    async ({ ctx }): Promise<WallboxStatusWithChargingSession[]> => {
        const [wallboxesResult, chargingSessionsResult] = await Promise.all([
            getWallboxes(),
            getCurrentChargingSessions(ctx.cobotSpaceSettings),
        ]);
        if (!wallboxesResult.ok) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: `Error fetching Wallbox status: ${wallboxesResult.error}`,
            });
        }

        const wallboxes = wallboxesResult.value;
        return wallboxes.map((wallbox) => ({
            ...wallbox,
            chargingSession: chargingSessionsResult[wallbox.id] ?? {
                ok: false,
                error: 'resource for charger not configured',
            },
        }));
    },
);

export const startChargingWithSession = adminProcedure
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

export const stopChargingWithSession = adminProcedure
    .input(z.object({ chargerId: z.string() }))
    .mutation(async ({ ctx, input }) => {
        const result = await stopChargingSession(ctx.userDetails, ctx.cobotSpaceSettings, input.chargerId);
        if (!result.ok) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: `Error stopping charging: ${result.error}`,
            });
        }
        return result.value;
    });

export const startChargingWithoutSession = adminProcedure
    .input(z.object({ chargerId: z.string() }))
    .mutation(async ({ input }) => {
        const result = await cfosAuthorizeWallbox(input.chargerId);
        if (!result.ok) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: `Error starting charging without session: ${result.error}`,
            });
        }
    });

export const stopChargingWithoutSession = adminProcedure
    .input(z.object({ chargerId: z.string() }))
    .mutation(async ({ input }) => {
        const result = await cfosDeauthorizeWallbox(input.chargerId);
        if (!result.ok) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: `Error stopping charging without session: ${result.error}`,
            });
        }
        return result.value;
    });

// export const stopChargingBooking = adminProcedure
//     .input(z.object({ bookingId: z.string(), energyStop: z.number() }))
//     .mutation(async ({ input }) => {
//         const result = await ...
//         if (!result.ok) {
//             throw new TRPCError({
//                 code: 'INTERNAL_SERVER_ERROR',
//                 message: `Error stopping charging without session: ${result.error}`,
//             });
//         }
//         return result.value;
//     });

export const getChargingSessionHistory = adminProcedure
    .input(
        z.object({
            from: z.string().datetime(),
            to: z.string().datetime(),
            chargerIds: z.string().array().nullable(),
            cobotMembershipId: CobotMembershipId.nullable(),
        }),
    )
    .query(async ({ ctx, input }) => {
        const result = await getHistoricChargingSessions(
            ctx.cobotSpaceSettings,
            new Date(input.from),
            new Date(input.to),
            input.chargerIds,
            input.cobotMembershipId === MEMBERSHIP_ID_NOBODY ? undefined : input.cobotMembershipId,
        );
        if (!result.ok) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: `Error fetching charging session history: ${result.error}`,
            });
        }
        return result.value;
    });
