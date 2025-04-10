import { router } from './base';
import { authorizeWallbox, getWallboxStatus } from './wallbox';

export const appRouter = router({
    getWallboxStatus,
    authorizeWallbox,
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
