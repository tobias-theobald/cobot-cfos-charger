import { cfosAuthorizeWallbox, cfosDeauthorizeWallbox, getWallboxById } from '@/api/cfos';
import { createActivity, createBooking, listMembershipsWithIdNameEmail, updateBooking } from '@/api/cobot';
import { BOOKING_DURATION_AT_START } from '@/constants';
import { getCurrentChargingSession } from '@/services/chargingSessionService';
import type { ValueOrError } from '@/types/util';
import type { CobotApiRequestPostActivityBody, CobotApiResponseGetUserDetails } from '@/types/zod/cobotApi';
import type {
    ChargingSessionBookingEndComment,
    ChargingSessionBookingStartComment,
    CobotSpaceSettings,
} from '@/types/zod/other';

/**
 * Start a charging session on the wallbox. This function assumes this user is allowed to start a session on behalf of the given membership.
 * @param userDetails
 * @param cobotSpaceSettings
 * @param chargerId
 * @param cobotMembershipId this should not be the nobody membership ID constant
 */
export const startChargingSession = async (
    userDetails: CobotApiResponseGetUserDetails,
    cobotSpaceSettings: CobotSpaceSettings,
    chargerId: string,
    cobotMembershipId: string | null,
): Promise<ValueOrError<void>> => {
    const {
        accessToken: cobotSpaceAccessToken,
        spaceSubdomain: cobotSpaceSubdomain,
        resourceMapping,
    } = cobotSpaceSettings;

    const resourceId = resourceMapping[chargerId];
    if (!resourceId) {
        return { ok: false, error: `Wallbox with id ${chargerId} not mapped to a resource` };
    }

    const wallbox = await getWallboxById(chargerId);
    if (!wallbox.ok) {
        return wallbox;
    }

    // TODO check with real hardware if these validations make sense
    const { evseWallboxState, friendlyName, totalEnergyWattHours, chargingEnabled } = wallbox.value;
    if (evseWallboxState !== 'free' && evseWallboxState !== 'vehiclePresent') {
        return { ok: false, error: `Wallbox with id ${chargerId} is not available` };
    }

    // TODO check for open sessions

    const membership_id = cobotMembershipId === null ? undefined : cobotMembershipId;

    // Create booking for the charger's resource with some metadata in the description
    const bookingStartComment: ChargingSessionBookingStartComment = {
        totalEnergyWattHoursStart: totalEnergyWattHours,
        cobotUserIdStarted: userDetails.id,
        cobotMembershipId,
        chargerId,
    };
    const createBookingResult = await createBooking(cobotSpaceAccessToken, cobotSpaceSubdomain, resourceId, {
        from: new Date().toISOString(),
        to: new Date(Date.now() + BOOKING_DURATION_AT_START).toISOString(),
        title: `EV charging session (usage TBD)`,
        comments: JSON.stringify(bookingStartComment),
        membership_id,
        can_cancel: false,
        can_change: false,
    });
    if (!createBookingResult.ok) {
        return createBookingResult;
    }
    console.log(`Created booking for resource ${resourceId} with id ${createBookingResult.value.id}`);

    const authorizeWallboxResult = await cfosAuthorizeWallbox(chargerId);
    if (!authorizeWallboxResult.ok) {
        return authorizeWallboxResult;
    }

    const channels: CobotApiRequestPostActivityBody['channels'] = ['admin'];
    let source_ids: string[] | undefined = undefined;
    let onBehalfOf: string = '(no membership) ';
    if (cobotMembershipId !== null) {
        channels.push('membership');
        source_ids = [cobotMembershipId];

        const membershipDetails = await listMembershipsWithIdNameEmail(cobotSpaceAccessToken, cobotSpaceSubdomain, [
            cobotMembershipId,
        ]);
        if (!membershipDetails.ok) {
            return membershipDetails;
        }

        onBehalfOf = `on behalf of ${membershipDetails.value[0].name} `;
    }

    const createActivityResult = await createActivity(cobotSpaceAccessToken, cobotSpaceSubdomain, {
        text: `EV charging session started by user ${userDetails.email} ${onBehalfOf}on charger ${friendlyName}`,
        channels,
        source_ids,
    });
    if (!createActivityResult.ok) {
        return createActivityResult;
    }

    return { ok: true, value: undefined };
};
export type StopChargingSessionResult = {
    wattHoursUsed: number;
    duration: number;
    price: number;
};
export const stopChargingSession = async (
    userDetails: CobotApiResponseGetUserDetails | null,
    cobotSpaceSettings: CobotSpaceSettings,
    chargerId: string,
): Promise<ValueOrError<StopChargingSessionResult>> => {
    const {
        accessToken: cobotSpaceAccessToken,
        spaceSubdomain: cobotSpaceSubdomain,
        resourceMapping,
        pricePerKWh,
    } = cobotSpaceSettings;

    const resourceId = resourceMapping[chargerId];
    if (!resourceId) {
        return { ok: false, error: `Wallbox with id ${chargerId} not mapped to a resource` };
    }

    const wallbox = await getWallboxById(chargerId);
    if (!wallbox.ok) {
        return wallbox;
    }

    const { friendlyName, totalEnergyWattHours: totalEnergyWattHoursEnd } = wallbox.value;

    // Actually disable charger
    const cfosResult = await cfosDeauthorizeWallbox(chargerId);
    if (!cfosResult.ok) {
        return cfosResult;
    }

    // Find the current booking
    const now = new Date();
    const getCurrentBookingResult = await getCurrentChargingSession(cobotSpaceSettings, chargerId);
    if (!getCurrentBookingResult.ok) {
        return { ok: false, error: `Charger stopped but error fetching bookings` };
    }

    const currentBooking = getCurrentBookingResult.value;
    if (!currentBooking) {
        return { ok: false, error: `Charger stopped but no active booking found` };
    }

    const {
        totalEnergyWattHoursStart,
        cobotMembershipId,
        cobotUserIdStarted,
        bookingId,
        chargerId: chargerIdFromBooking,
    } = currentBooking;

    if (chargerId !== chargerIdFromBooking) {
        return { ok: false, error: `Charger stopped but booking is for a different charger` };
    }

    const energyWattHoursUsed = totalEnergyWattHoursEnd - totalEnergyWattHoursStart;
    const energyKilowattHoursUsed = energyWattHoursUsed / 1000;
    let price = cobotMembershipId === null ? 0 : energyKilowattHoursUsed * pricePerKWh;
    const duration = (now.getTime() - new Date(currentBooking.from).getTime()) / 1000; // seconds
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

    if (price < 0) {
        console.warn('Price is negative, setting to 0');
        price = 0;
    }

    const bookingEndComment: ChargingSessionBookingEndComment = {
        totalEnergyWattHoursStart,
        totalEnergyWattHoursEnd,
        energyWattHoursUsed,
        cobotMembershipId,
        cobotUserIdStarted,
        cobotUserIdEnded: userDetails?.id ?? null,
        price: price.toFixed(2),
        chargerId,
    };

    const updateBookingResult = await updateBooking(cobotSpaceAccessToken, cobotSpaceSubdomain, bookingId, {
        to: oneMinuteAgo.toISOString(), // This will allow a new charging session to be started immediately
        title: `EV charging session (${energyKilowattHoursUsed.toFixed(3)} kWh)`,
        comments: JSON.stringify(bookingEndComment),
        has_custom_price: true,
        price,
    });
    if (!updateBookingResult.ok) {
        return updateBookingResult;
    }

    const channels: CobotApiRequestPostActivityBody['channels'] = ['admin'];
    let source_ids: string[] | undefined = undefined;
    let onBehalfOf: string = '(no membership) ';
    let byline: string;
    if (cobotMembershipId !== null) {
        channels.push('membership');
        source_ids = [cobotMembershipId];

        const membershipDetails = await listMembershipsWithIdNameEmail(cobotSpaceAccessToken, cobotSpaceSubdomain, [
            cobotMembershipId,
        ]);
        if (!membershipDetails.ok) {
            return membershipDetails;
        }

        onBehalfOf = `on behalf of ${membershipDetails.value[0].name} `;
    }
    if (userDetails) {
        byline = `by user ${userDetails.email}`;
    } else {
        byline = `by system`;
    }

    const createActivityResult = await createActivity(cobotSpaceAccessToken, cobotSpaceSubdomain, {
        text: `EV charging session ended ${byline} ${onBehalfOf}on charger ${friendlyName}`,
        channels,
        source_ids,
    });
    if (!createActivityResult.ok) {
        return createActivityResult;
    }

    return {
        ok: true,
        value: {
            wattHoursUsed: energyWattHoursUsed,
            duration,
            price,
        },
    };
};
