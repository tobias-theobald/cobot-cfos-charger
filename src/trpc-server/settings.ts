import { spaceSettingsStore } from '@/storage';
import { adminProcedure } from '@/trpc-server/base';
import { CobotSpaceSettingsForUi } from '@/types/zod/other';

export const getCobotSpaceSettings = adminProcedure.query(async ({ ctx }): Promise<CobotSpaceSettingsForUi> => {
    return CobotSpaceSettingsForUi.parse(ctx.cobotSpaceSettings);
});

export const setCobotSpaceSettings = adminProcedure
    .input(CobotSpaceSettingsForUi)
    .mutation(async ({ ctx, input }): Promise<void> => {
        await spaceSettingsStore.set({
            ...ctx.cobotSpaceSettings,
            ...input,
        });
    });
