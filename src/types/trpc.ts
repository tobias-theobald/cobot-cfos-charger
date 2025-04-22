import type { RunningChargingSessionInBooking } from '@/services/chargingSessionService';
import type { ValueOrError } from '@/types/util';
import type { GetWallboxesResponse } from '@/types/zod/cfos';

export type WallboxStatusWithChargingSession = GetWallboxesResponse[number] & {
    chargingSession: ValueOrError<RunningChargingSessionInBooking | null>;
};
