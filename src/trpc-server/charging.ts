import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { getWallboxes } from '@/api/cfos';
import { MEMBERSHIP_ID_NOBODY } from '@/constants';
import { startChargingSession, stopChargingSession } from '@/services/chargingControlService';
import {
    getCurrentChargingSessions,
    getHistoricChargingSessions,
    type RunningChargingSessionInBooking,
} from '@/services/chargingSessionService';
import type { ValueOrError } from '@/types/util';
import type { GetWallboxesResponse } from '@/types/zod/cfos';
import { CobotMembershipId } from '@/types/zod/cobotApi';

import { adminProcedure } from './base';

export const getWallboxStatus = adminProcedure.query(
    async ({
        ctx,
    }): Promise<
        (GetWallboxesResponse[number] & {
            chargingSession: ValueOrError<RunningChargingSessionInBooking | null>;
        })[]
    > => {
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
        const result = await stopChargingSession(ctx.userDetails, ctx.cobotSpaceSettings, input.chargerId);
        if (!result.ok) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: `Error stopping charging: ${result.error}`,
            });
        }
        return result.value;
    });

export const getChargingSessionHistory = adminProcedure
    .input(
        z.object({
            from: z.string().date(),
            to: z.string().date(),
            chargerIds: z.string().array().nullable(),
            cobotMembershipId: CobotMembershipId.nullish(),
        }),
    )
    .query(async ({ ctx, input }) => {
        const result = await getHistoricChargingSessions(
            ctx.cobotSpaceSettings,
            new Date(input.from),
            new Date(input.to),
            input.chargerIds,
            input.cobotMembershipId,
        );
        if (!result.ok) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: `Error fetching charging session history: ${result.error}`,
            });
        }
    });
