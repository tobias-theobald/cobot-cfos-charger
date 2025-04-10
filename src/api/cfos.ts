import { z } from 'zod';

import { CFOS_BASE_URL, CFOS_RFID_ID } from '../env';
import type { ValueOrError } from '../types/util';
import { fetchWithTypeCheckedJsonResponse } from './base';

const mainBaseUrl = new URL(CFOS_BASE_URL);
const { username, password } = mainBaseUrl;
const basicAuth = { username: decodeURIComponent(username), password: decodeURIComponent(password) };
mainBaseUrl.password = '';
mainBaseUrl.username = '';
mainBaseUrl.pathname = mainBaseUrl.pathname + '/cnf';

export type GetWallboxesResponse = {
    id: string;
    totalEnergyWattHours: number;
    friendlyName: string;
    address: string;
    evseWallboxState: EvseWallboxState;
    chargingEnabled: boolean;
}[];
const EvsePowerbrainDevice = z.object({
    dev_type: z.literal('evse_powerbrain'), // filter out evse_powerbrain
    address: z.literal('evse:').or(z.string()),
    desc: z.string(),
    state: z.number().int().min(0).max(5),
    dev_id: z.string(),
    total_energy: z.number(),
    charging_enabled: z.boolean(),
});
type EvsePowerbrainDevice = z.infer<typeof EvsePowerbrainDevice>;
const GetWallboxesApiResponse = z.object({
    devices: z.array(EvsePowerbrainDevice.or(z.object({ dev_type: z.string() }))),
});
export const getWallboxes = async (): Promise<ValueOrError<GetWallboxesResponse>> => {
    console.log('fetching all wallboxes');
    const url = new URL(mainBaseUrl);
    url.searchParams.set('cmd', 'get_dev_info');

    const result = await fetchWithTypeCheckedJsonResponse({
        method: 'get',
        url,
        basicAuth,
        expectedType: GetWallboxesApiResponse,
    });
    if (!result.ok) {
        return result;
    }
    const filteredDevices: GetWallboxesResponse = [];
    for (const device of result.value.devices) {
        if (device.dev_type !== 'evse_powerbrain') {
            continue;
        }
        const typedDevice = device as EvsePowerbrainDevice;
        let address = mainBaseUrl.hostname;
        if (typedDevice.address !== 'evse:') {
            address = typedDevice.address.split(':')[0];
        }
        filteredDevices.push({
            friendlyName: typedDevice.desc,
            address,
            evseWallboxState: evseWallboxStateMap[typedDevice.state],
            id: typedDevice.dev_id,
            totalEnergyWattHours: typedDevice.total_energy,
            chargingEnabled: typedDevice.charging_enabled,
        });
    }
    return {
        ok: true,
        value: filteredDevices,
    };
};

export type EvseWallboxState = 'free' | 'vehiclePresent' | 'charging' | 'offline' | 'error';
const evseWallboxStateMap: Record<number, EvseWallboxState> = {
    1: 'free',
    2: 'vehiclePresent',
    3: 'charging',
    4: 'charging',
    5: 'error',
    6: 'offline',
} as const;

export const cfosAuthorizeWallbox = async (id: string): Promise<ValueOrError<undefined>> => {
    console.log('fetching wallbox state');
    const url = new URL(mainBaseUrl);
    url.searchParams.set('cmd', 'enter_rfid');
    url.searchParams.set('rfid', CFOS_RFID_ID);
    url.searchParams.set('dev_id', id);

    return await fetchWithTypeCheckedJsonResponse({
        method: 'get',
        url,
        basicAuth,
        expectedType: null,
    });
};

// type GetWallboxRegistersReturn = {
//     evseWallboxState: EvseWallboxState;
// };
// const GetWallboxRegistersResponse = z.object({
//     '8092': z.number().int().min(1).max(6),
// });
// export const getWallboxRegisters = async (baseUrl: URL): Promise<ValueOrError<GetWallboxRegistersReturn>> => {
//     console.log('fetching wallbox state');
//     const url = new URL(baseUrl);
//     url.searchParams.set('cmd', 'modbus');
//     url.searchParams.set('device', 'evse');
//     url.searchParams.set('read', 'all');
//
//     const result = await fetchWithTypeCheckedJsonResponse({
//         method: 'get',
//         url,
//         basicAuth,
//         expectedType: GetWallboxRegistersResponse,
//     });
//     if (!result.ok) {
//         return result;
//     }
//     return {
//         ok: true,
//         value: {
//             evseWallboxState: evseWallboxStateMap[result.value['8092']],
//         },
//     };
// };
