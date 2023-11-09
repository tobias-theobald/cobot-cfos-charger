import { z } from 'zod';
import { procedure } from './base';

export const getCobotUserId = procedure.query(({ ctx }) => {
    return {
        userId: ctx.cobotUserId,
    };
});

export const generateGreeting = procedure.input(z.object({ name: z.string() })).mutation(({ ctx, input }) => {
    return `Hello ${input.name} (user ID: ${ctx.cobotUserId} from the server)`;
});
