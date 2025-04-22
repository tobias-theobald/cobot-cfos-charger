import { getMemberships, getResources } from '@/trpc-server/cobot';
import { getCobotSpaceSettings, setCobotSpaceSettings } from '@/trpc-server/settings';

import { router } from './base';
import {
    getChargingSessionHistory,
    getWallboxesStatusWithChargingSession,
    startChargingWithoutSession,
    startChargingWithSession,
    stopChargingWithoutSession,
    stopChargingWithSession,
} from './charging';

export const appRouter = router({
    getWallboxesStatusWithChargingSession,
    getChargingSessionHistory,
    startChargingWithSession,
    stopChargingWithSession,

    startChargingWithoutSession,
    stopChargingWithoutSession,

    getMemberships,
    getResources,

    getCobotSpaceSettings,
    setCobotSpaceSettings,
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
