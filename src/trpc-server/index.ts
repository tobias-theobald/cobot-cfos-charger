import { getMemberships, getResources } from '@/trpc-server/cobot';
import { getCobotSpaceSettings, setCobotSpaceSettings } from '@/trpc-server/settings';

import { router } from './base';
import { getWallboxStatus, startCharging, stopCharging } from './charging';

export const appRouter = router({
    getWallboxStatus,
    startCharging,
    stopCharging,

    getMemberships,
    getResources,

    getCobotSpaceSettings,
    setCobotSpaceSettings,
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
