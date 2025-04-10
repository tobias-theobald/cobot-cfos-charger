import { cfosAuthorizeWallbox, cfosDeauthorizeWallbox, getWallboxes } from '@/api/cfos';
import { createActivity, getActivities, listMembershipsWithIdNameEmail } from '@/api/cobot';
import { MEMBERSHIP_ID_NOBODY } from '@/constants';
import type { ValueOrError } from '@/types/util';
import type { CobotApiRequestPostActivityBody, CobotApiResponseGetUserDetails } from '@/types/zod';

export const startChargingSession = async (
    userDetails: CobotApiResponseGetUserDetails,
    cobotAccessToken: string,
    cobotSpaceSubdomain: string,
    chargerId: string,
    cobotMembershipId: string,
): Promise<ValueOrError<void>> => {
    const wallboxState = await getWallboxes();
    if (!wallboxState.ok) {
        return wallboxState;
    }
    const wallbox = wallboxState.value.find((w) => w.id === chargerId);
    if (!wallbox) {
        return { ok: false, error: `Wallbox with id ${chargerId} not found` };
    }

    // TODO check with real hardware if these validations make sense
    const { evseWallboxState, friendlyName, totalEnergyWattHours, chargingEnabled } = wallbox;
    if (evseWallboxState !== 'free' && evseWallboxState !== 'vehiclePresent') {
        return { ok: false, error: `Wallbox with id ${chargerId} is not available` };
    }

    // TODO check for open sessions

    const result = await cfosAuthorizeWallbox(chargerId);
    if (!result.ok) {
        return result;
    }

    const channels: CobotApiRequestPostActivityBody['channels'] = ['admin'];
    let source_ids: string[] | undefined = undefined;
    let onBehalfOf: string = '(no membership) ';
    if (cobotMembershipId !== MEMBERSHIP_ID_NOBODY) {
        channels.push('membership');
        source_ids = [cobotMembershipId];

        const membershipDetails = await listMembershipsWithIdNameEmail(cobotAccessToken, cobotSpaceSubdomain, [
            cobotMembershipId,
        ]);
        if (!membershipDetails.ok) {
            return membershipDetails;
        }

        onBehalfOf = `on behalf of ${membershipDetails.value[0].name} `;
    }

    const createActivityResult = await createActivity(cobotAccessToken, cobotSpaceSubdomain, {
        text: `EV charging session by user ${userDetails.email} ${onBehalfOf}on charger ${friendlyName} (${JSON.stringify({ chargerId, totalEnergyWattHours, cobotMembershipId })})`,
        channels,
        source_ids,
    });

    console.log(createActivityResult);
    // TODO implement the logic to note down who started the session and at what watt-hour meter value
    return { ok: true, value: undefined };
};

export type StopChargingSessionResult = {
    wattHoursUsed: number;
    duration: number;
    cost: number;
    currency: string;
};
export const stopChargingSession = async (
    userDetails: CobotApiResponseGetUserDetails,
    cobotAccessToken: string,
    cobotSpaceSubdomain: string,
    chargerId: string,
): Promise<ValueOrError<StopChargingSessionResult>> => {
    const wallboxState = await getWallboxes();
    if (!wallboxState.ok) {
        return wallboxState;
    }

    const wallbox = wallboxState.value.find((w) => w.id === chargerId);
    if (!wallbox) {
        return { ok: false, error: `Wallbox with id ${chargerId} not found` };
    }
    const { evseWallboxState, friendlyName, totalEnergyWattHours } = wallbox;
    // TODO double check if the session is still active

    const result = await cfosDeauthorizeWallbox(chargerId);
    if (!result.ok) {
        return result;
    }

    const activities = await getActivities(cobotAccessToken, cobotSpaceSubdomain, {
        from: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        to: new Date().toISOString(),
        types: ['text'],
    });

    console.log(JSON.stringify(activities, null, 2));

    // TODO implement the logic to look up the session and the watt-hour meter value
    // TODO implement creating a charge in Cobot
    return {
        ok: true,
        value: {
            wattHoursUsed: 0,
            duration: 0,
            cost: 0,
            currency: 'EUR',
        },
    };
};
