import { listBookingsForResourceAndTimeframe } from '@/api/cobot';
import { BOOKING_DURATION_AT_START } from '@/constants';
import type { ValueOrError } from '@/types/util';
import type { CobotSpaceSettings } from '@/types/zod/other';
import { ChargingSessionBookingEndComment, ChargingSessionBookingStartComment } from '@/types/zod/other';

export type BookingComponentsForChargingSession = { bookingId: string; from: Date; to: Date };
export type RunningChargingSessionInBooking = ChargingSessionBookingStartComment & BookingComponentsForChargingSession;
export const getCurrentChargingSession = async (
    cobotSpaceSettings: CobotSpaceSettings,
    chargerId: string,
): Promise<ValueOrError<RunningChargingSessionInBooking | null>> => {
    const {
        accessToken: cobotSpaceAccessToken,
        spaceSubdomain: cobotSpaceSubdomain,
        resourceMapping,
    } = cobotSpaceSettings;

    const resourceId = resourceMapping[chargerId];
    if (!resourceId) {
        return { ok: false, error: `Wallbox with id ${chargerId} not mapped to a resource` };
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
        return { ok: true, value: null };
    }
    const { id: bookingId, comments, title, from, to } = currentBooking;
    if (!comments) {
        return { ok: false, error: `Charger stopped but booking ${title} is invalid (no comment)` };
    }
    let commentsParsed;
    try {
        commentsParsed = JSON.parse(comments);
    } catch (err) {
        return { ok: false, error: `Charger stopped but booking ${title} is invalid (comment not JSON)` };
    }
    const bookingComment = ChargingSessionBookingStartComment.safeParse(commentsParsed);
    if (!bookingComment.success) {
        return {
            ok: false,
            error: `Charger stopped but booking ${title} is invalid (comment not BookingStartComment)`,
        };
    }
    return {
        ok: true,
        value: { ...bookingComment.data, bookingId, from: new Date(from), to: new Date(to) },
    };
};

/**
 * Returns the current charging sessions for all wallboxes in the given Cobot space by charger ID.
 * @param cobotSpaceSettings
 */
export const getCurrentChargingSessions = async (
    cobotSpaceSettings: CobotSpaceSettings,
): Promise<Record<string, ValueOrError<RunningChargingSessionInBooking | null>>> => {
    const { resourceMapping } = cobotSpaceSettings;

    const bookingPromises = Object.keys(resourceMapping).map(async (chargerId) => {
        const currentChargingSession = await getCurrentChargingSession(cobotSpaceSettings, chargerId);
        return [chargerId, currentChargingSession];
    });

    const bookingReturns = await Promise.all(bookingPromises);
    return Object.fromEntries(bookingReturns);
};

/**
 * Returns the historic charging sessions for the given Cobot space and time range.
 * @param cobotSpaceSettings
 * @param from
 * @param to
 * @param chargerIds set to null for all chargers
 * @param cobotMembershipId set to null for all memberships, undefined for no membership
 */
export const getHistoricChargingSessions = async (
    cobotSpaceSettings: CobotSpaceSettings,
    from: Date,
    to: Date,
    chargerIds: string[] | null,
    cobotMembershipId: string | null | undefined,
): Promise<
    ValueOrError<
        ((ChargingSessionBookingEndComment | ChargingSessionBookingStartComment) &
            BookingComponentsForChargingSession)[]
    >
> => {
    const {
        accessToken: cobotSpaceAccessToken,
        spaceSubdomain: cobotSpaceSubdomain,
        resourceMapping,
    } = cobotSpaceSettings;

    const effectiveChargerIds = chargerIds ?? Object.keys(resourceMapping);

    const resourceIds = [];
    for (const chargerId of effectiveChargerIds) {
        const resourceId = resourceMapping[chargerId];
        if (resourceId === undefined) {
            return { ok: false, error: `Wallbox with id ${chargerId} not mapped to a resource` };
        }
        resourceIds.push(resourceId);
    }

    const listBookingResults = await Promise.all(
        resourceIds.map((resourceId) =>
            listBookingsForResourceAndTimeframe(
                cobotSpaceAccessToken,
                cobotSpaceSubdomain,
                resourceId,
                from.toISOString(),
                to.toISOString(),
            ),
        ),
    );

    const bookings: ((ChargingSessionBookingEndComment | ChargingSessionBookingStartComment) &
        BookingComponentsForChargingSession)[] = [];
    for (const bookingsForCharger of listBookingResults) {
        if (!bookingsForCharger.ok) {
            return bookingsForCharger;
        }
        for (const currentBooking of bookingsForCharger.value) {
            const { id: bookingId, comments, from: bookingFrom, to: bookingTo, membership } = currentBooking;
            if (cobotMembershipId === undefined && membership) {
                // filtering for no membership but booking has membership
                continue;
            }
            if (typeof cobotMembershipId === 'string' && membership?.id !== cobotMembershipId) {
                // filtering for specific membership but booking has different membership
                continue;
            }
            // at this point either cobotMembershipId is null or the booking has the same membership id as requested
            if (!comments) {
                // booking invalid, no comment
                continue;
            }
            let commentsParsed;
            try {
                commentsParsed = JSON.parse(comments);
            } catch (err) {
                // booking invalid, comment not JSON
                continue;
            }
            const bookingComment = ChargingSessionBookingEndComment.safeParse(commentsParsed);
            if (bookingComment.success) {
                bookings.push({
                    ...bookingComment.data,
                    bookingId,
                    from: new Date(bookingFrom),
                    to: new Date(bookingTo),
                });
                continue;
            }
            // Check for ongoing or broken sessions
            const bookingCommentStart = ChargingSessionBookingStartComment.safeParse(commentsParsed);
            if (bookingCommentStart.success) {
                bookings.push({
                    ...bookingCommentStart.data,
                    bookingId,
                    from: new Date(bookingFrom),
                    to: new Date(bookingTo),
                });
            }
        }
    }
    return {
        ok: true,
        value: bookings,
    };
};
