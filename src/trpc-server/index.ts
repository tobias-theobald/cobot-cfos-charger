import { getMemberships } from '@/trpc-server/cobot';

import { router } from './base';
import { getWallboxStatus, startCharging, stopCharging } from './wallbox';

export const appRouter = router({
    getWallboxStatus,
    startCharging,
    stopCharging,

    getMemberships,
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
