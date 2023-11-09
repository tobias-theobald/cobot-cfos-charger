import { router } from './base';
import { generateGreeting, getCobotUserId } from './test';

export const appRouter = router({
    getCobotUserId,
    generateGreeting,
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
