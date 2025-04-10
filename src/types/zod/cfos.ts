import { z } from 'zod';

const EvsePowerbrainDevice = z.object({
    dev_type: z.literal('evse_powerbrain'), // filter out evse_powerbrain
    address: z.literal('evse:').or(z.string()),
    desc: z.string(),
    state: z.number().int().min(0).max(5),
    dev_id: z.string(),
    total_energy: z.number(),
    charging_enabled: z.boolean(),
});
export type EvsePowerbrainDevice = z.infer<typeof EvsePowerbrainDevice>;

export const GetWallboxesApiResponse = z.object({
    devices: z.array(EvsePowerbrainDevice.or(z.object({ dev_type: z.string() }))),
});

export type EvseWallboxState = 'free' | 'vehiclePresent' | 'charging' | 'offline' | 'error';
export const evseWallboxStateMap: Record<number, EvseWallboxState> = {
    1: 'free',
    2: 'vehiclePresent',
    3: 'charging',
    4: 'charging',
    5: 'error',
    6: 'offline',
} as const;

export type GetWallboxesResponse = {
    id: string;
    totalEnergyWattHours: number;
    friendlyName: string;
    address: string;
    evseWallboxState: EvseWallboxState;
    chargingEnabled: boolean;
}[];
