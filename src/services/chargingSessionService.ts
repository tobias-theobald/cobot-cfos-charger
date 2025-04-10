import { cfosAuthorizeWallbox, cfosDeauthorizeWallbox, getWallboxes } from '@/api/cfos';
import {
    createActivity,
    createBooking,
    listBookingsForResourceAndTimeframe,
    listMembershipsWithIdNameEmail,
    updateBooking,
} from '@/api/cobot';
import { BOOKING_DURATION_AT_START, MEMBERSHIP_ID_NOBODY } from '@/constants';
import type { ValueOrError } from '@/types/util';
import type { CobotApiRequestPostActivityBody, CobotApiResponseGetUserDetails } from '@/types/zod/cobotApi';
import type { CobotSpaceSettings } from '@/types/zod/other';
import { BookingStartComment } from '@/types/zod/other';

/**
 * Start a charging session on the wallbox. This function assumes this user is allowed to start a session on behalf of the given membership.
 * @param userDetails
 * @param cobotSpaceSettings
 * @param chargerId
 * @param cobotMembershipId
 */
export const startChargingSession = async (
    userDetails: CobotApiResponseGetUserDetails,
    cobotSpaceSettings: CobotSpaceSettings,
    chargerId: string,
    cobotMembershipId: string,
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

    const membership_id = cobotMembershipId === MEMBERSHIP_ID_NOBODY ? undefined : cobotMembershipId;

    // Create booking for the charger's resource with some metadata in the description
    const bookingStartComment: BookingStartComment = {
        totalEnergyWattHoursStart: totalEnergyWattHours,
        cobotMembershipId,
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
    if (cobotMembershipId !== MEMBERSHIP_ID_NOBODY) {
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
    userDetails: CobotApiResponseGetUserDetails,
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

    const wallboxState = await getWallboxes();
    if (!wallboxState.ok) {
        return wallboxState;
    }

    const wallbox = wallboxState.value.find((w) => w.id === chargerId);
    if (!wallbox) {
        return { ok: false, error: `Wallbox with id ${chargerId} not found` };
    }
    const { evseWallboxState, friendlyName, totalEnergyWattHours } = wallbox;

    // Actually disable charger
    const cfosResult = await cfosDeauthorizeWallbox(chargerId);
    if (!cfosResult.ok) {
        return cfosResult;
    }

    const listBookingResult = await listBookingsForResourceAndTimeframe(
        cobotSpaceAccessToken,
        cobotSpaceSubdomain,
        resourceId,
        new Date(Date.now() - BOOKING_DURATION_AT_START).toISOString(),
        new Date(Date.now() + BOOKING_DURATION_AT_START).toISOString(),
    );
    if (!listBookingResult.ok) {
        return listBookingResult;
    }
    const bookings = listBookingResult.value;

    // Find the current booking
    const now = new Date();
    const currentBooking = bookings.find(({ from, to }) => {
        return new Date(from) <= now && now <= new Date(to);
    });
    if (!currentBooking) {
        createActivity(cobotSpaceAccessToken, cobotSpaceSubdomain, {
            text: `EV charging session ended by user ${userDetails.email} on charger ${friendlyName} at ${(totalEnergyWattHours / 1000).toFixed(3)}kWh but no booking found! Please update the booking manually and create a charge.`,
            channels: ['admin'],
        }).catch((err) => {
            console.error('Failed to create activity at booking error', err, {
                userDetails,
                chargerId,
                wallbox,
                totalEnergyWattHours,
                now: now.toISOString(),
            });
        });
        return { ok: false, error: `Charger stopped but no booking found` };
    }

    const { id: bookingId, comments, title } = currentBooking;
    if (!comments) {
        return { ok: false, error: `Charger stopped but booking ${title} is invalid (no comment)` };
    }
    let commentsParsed;
    try {
        commentsParsed = JSON.parse(comments);
    } catch (err) {
        return { ok: false, error: `Charger stopped but booking ${title} is invalid (comment not JSON)` };
    }
    const bookingComment = BookingStartComment.safeParse(commentsParsed);
    if (!bookingComment.success) {
        return {
            ok: false,
            error: `Charger stopped but booking ${title} is invalid (comment not BookingStartComment)`,
        };
    }
    const { totalEnergyWattHoursStart, cobotMembershipId } = bookingComment.data;

    const wattHoursUsed = totalEnergyWattHours - totalEnergyWattHoursStart;
    const kilowattHoursUsed = wattHoursUsed / 1000;
    let price = cobotMembershipId === MEMBERSHIP_ID_NOBODY ? 0 : kilowattHoursUsed * pricePerKWh;
    const duration = (now.getTime() - new Date(currentBooking.from).getTime()) / 1000; // seconds

    if (price < 0) {
        console.warn('Price is negative, setting to 0');
        price = 0;
    }

    const updateBookingResult = await updateBooking(cobotSpaceAccessToken, cobotSpaceSubdomain, bookingId, {
        to: now.toISOString(),
        title: `EV charging session (${kilowattHoursUsed.toFixed(3)} kWh)`,
        comments: JSON.stringify({
            totalEnergyWattHoursStart,
            totalEnergyWattHoursEnd: totalEnergyWattHours,
            cobotMembershipId,
        }),
        has_custom_price: true,
        price,
    });
    if (!updateBookingResult.ok) {
        return updateBookingResult;
    }

    const channels: CobotApiRequestPostActivityBody['channels'] = ['admin'];
    let source_ids: string[] | undefined = undefined;
    let onBehalfOf: string = '(no membership) ';
    if (cobotMembershipId !== MEMBERSHIP_ID_NOBODY) {
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
        text: `EV charging session ended by user ${userDetails.email} ${onBehalfOf}on charger ${friendlyName}`,
        channels,
        source_ids,
    });
    if (!createActivityResult.ok) {
        return createActivityResult;
    }

    return {
        ok: true,
        value: {
            wattHoursUsed,
            duration,
            price,
        },
    };
};
