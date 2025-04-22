import { getWallboxes } from '@/api/cfos';
import { stopChargingSession } from '@/services/chargingControlService';
import { getCurrentChargingSessions } from '@/services/chargingSessionService';
import { spaceSettingsStore } from '@/storage';

// Private state variables
let intervalId: NodeJS.Timeout | null = null;
// noinspection PointlessArithmeticExpressionJS
let monitoringIntervalMs = 1 * 60 * 1000; // 1 minute in ms
let isRunning = false;

/**
 * Starts the wallbox monitoring service
 * @param intervalMs Optional interval in milliseconds between checks (defaults to 1 minute)
 * @returns Success status
 */
export function start(intervalMs?: number): { ok: boolean; error?: string } {
    // Don't start if already running
    if (isRunning) {
        return { ok: true };
    }

    // Update interval if provided
    if (intervalMs) {
        monitoringIntervalMs = intervalMs;
    }

    try {
        // Immediately run first check
        checkWallboxesStatus().catch((err) => {
            console.error('[WallboxMonitor] Error during initial check:', err);
        });

        // Set up interval for future checks
        intervalId = setInterval(() => {
            checkWallboxesStatus().catch((err) => {
                console.error('[WallboxMonitor] Error during scheduled check:', err);
            });
        }, monitoringIntervalMs);

        isRunning = true;

        console.log(`[WallboxMonitor] Started with ${monitoringIntervalMs / 1000}s interval`);
        return { ok: true };
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`[WallboxMonitor] Failed to start: ${errorMessage}`);
        return { ok: false, error: errorMessage };
    }
}

/**
 * Stops the wallbox monitoring service
 */
export function stop(): void {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        isRunning = false;
        console.log('[WallboxMonitor] Stopped');
    }
}

/**
 * Returns the current status of the monitoring service
 */
export function getStatus(): { isRunning: boolean; intervalMs: number } {
    return {
        isRunning,
        intervalMs: monitoringIntervalMs,
    };
}

/**
 * Checks all wallboxes with active charging sessions and ends sessions for unplugged cars
 * This is the main monitoring logic
 */
async function checkWallboxesStatus(): Promise<void> {
    try {
        // Get all space settings from storage
        const settingsResult = await spaceSettingsStore.getAll();
        if (!settingsResult.ok) {
            console.error(`[WallboxMonitor] Failed to get space settings: ${settingsResult.error}`);
            return;
        }

        const allSpaceSettings = settingsResult.value;
        console.log(`[WallboxMonitor] Checking ${allSpaceSettings.length} spaces`);

        // For each space, check all chargers with active sessions
        for (const spaceSetting of allSpaceSettings) {
            // Get all current charging sessions for this space
            const currentSessionsResult = await getCurrentChargingSessions(spaceSetting);

            // Get all wallboxes status
            const wallboxesResult = await getWallboxes();
            if (!wallboxesResult.ok) {
                console.error(`[WallboxMonitor] Failed to get wallboxes: ${wallboxesResult.error}`);
                continue;
            }

            const wallboxes = wallboxesResult.value;
            const wallboxesMap = new Map(wallboxes.map((wb) => [wb.id, wb]));

            // Check each active charging session
            for (const [chargerId, sessionResult] of Object.entries(currentSessionsResult)) {
                // Skip if no session or session error
                if (!sessionResult.ok || sessionResult.value === null) {
                    continue;
                }

                const wallbox = wallboxesMap.get(chargerId);

                // Skip if wallbox not found
                if (!wallbox) {
                    console.warn(`[WallboxMonitor] Wallbox ${chargerId} not found but has active session`);
                    continue;
                }

                // Check if wallbox is in a 'free' state (car unplugged)
                // Possible states from cfos.ts: 'free', 'vehiclePresent', 'charging', 'offline', 'error'
                if (!(wallbox.evseWallboxState === 'free' || wallbox.evseWallboxState === 'vehiclePresent')) {
                    continue;
                }
                console.log(
                    `[WallboxMonitor] Detected unplugged or not charging car on wallbox ${chargerId}, ending session`,
                );
                const stopResult = await stopChargingSession(null, spaceSetting, chargerId);
                if (stopResult.ok) {
                    console.log(`[WallboxMonitor] Successfully ended session for wallbox ${chargerId}`);
                } else {
                    console.error(`[WallboxMonitor] Failed to end session: ${stopResult.error}`);
                }
            }
        }
    } catch (err) {
        console.error('[WallboxMonitor] Error during check:', err);
    }
}
