import { z } from 'zod';
import { getWallboxes } from '../api/cfos';
import { procedure } from './base';

export const getWallboxStatus = procedure.query(({ ctx }) => {
    return getWallboxes();
});

export const setChargingState = procedure.input(z.object({ id: z.string() })).mutation(({ ctx, input }) => {
    // TODO check if this is possible
    // TODO store in database who started the session
    // TODO start charging session
});
