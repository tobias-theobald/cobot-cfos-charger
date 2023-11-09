import { router } from './base';
import { getWallboxStatus } from './wallbox';

export const appRouter = router({
    getWallboxStatus,
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
