import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import type { GetWallboxesResponse } from '@/api/cfos';
import { cfosAuthorizeWallbox, getWallboxes } from '@/api/cfos';
import { procedure } from './base';

export const getWallboxStatus = procedure.query(async ({ ctx }): Promise<GetWallboxesResponse> => {
    const result = await getWallboxes();
    if (!result.ok) {
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Error fetching Wallbox status: ${result.error}`,
        });
    }
    return result.value;
});

export const authorizeWallbox = procedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    // TODO check if this is possible
    // TODO store in database who started the session
    // TODO start charging session
    const result = await cfosAuthorizeWallbox(input.id);
    if (!result.ok) {
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Error fetching Wallbox status: ${result.error}`,
        });
    }
    return result.value;
});
