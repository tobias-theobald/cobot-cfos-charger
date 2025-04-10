// Cobot Types
import { z } from 'zod';

export const CobotAccessToken = z.string().min(1).max(500);
export const CobotSpaceSubdomain = z.string().regex(/^[a-z0-9][a-z0-9-]{0,99}$/);
export type CobotSpaceSubdomain = z.infer<typeof CobotSpaceSubdomain>;
export const CobotSpaceId = z.string().regex(/^[a-z0-9][a-z0-9-]{0,99}$/);
export type CobotSpaceId = z.infer<typeof CobotSpaceId>;
export const CobotMembershipId = z.string().regex(/^[a-z0-9][a-z0-9-]{0,99}$/);
export type CobotMembershipId = z.infer<typeof CobotMembershipId>;
export const CobotResourceId = z.string().min(1).max(100);
export type CobotResourceId = z.infer<typeof CobotResourceId>;
export const CobotBookingId = z.string().min(1).max(100);
export type CobotBookingId = z.infer<typeof CobotBookingId>;
export const CobotUserId = z.string().min(1).max(500);
export const CobotNavigationLinkSection = z.enum(['admin/setup', 'admin/manage', 'admin/analyze', 'members']);

// https://dev.cobot.me/api-docs/oauth-flow
export const CobotApiResponsePostOauthAccessToken = z.object({
    access_token: CobotAccessToken,
    token_type: z.literal('bearer'),
});

// https://dev.cobot.me/api-docs/access-tokens#create-access-token-for-a-space
export const CobotApiResponsePostOauthSpaceAccessToken = z.object({
    token: CobotAccessToken,
    client_id: z.string(),
    scope: z.array(z.string()),
});

// https://dev.cobot.me/api-docs/spaces#get-space-details
export const CobotApiResponseGetSpaceDetails = z.object({
    created_at: z.string(),
    name: z.string(),
    id: z.string(),
    url: z.string().url(),
    email: z.string().email(),
    description: z.string().nullable(),
    owner_id: z.string(),
    subdomain: CobotSpaceSubdomain,
    tax_rate: z.number(),
    price_display: z.string(),
    price_decimals: z.number(),
    country: z.string(),
    locale: z.string(),
    in_eu: z.boolean(),
    time_zone_name: z.string(),
    time_zone_offset: z.number(),
    hour_format: z.number(),
});

// https://dev.cobot.me/api-docs/memberships#list-members
export const CobotApiResponseGetUserDetails = z.object({
    id: CobotUserId,
    email: z.string(),
    memberships: z
        .object({
            id: z.string(), // Membership ID with this space!!
            space_subdomain: CobotSpaceSubdomain,
            space_name: z.string(),
            // space_link: z.string().url(),
            // name: z.string(),
            // link: z.string().url(),
        })
        .array(),
    admin_of: z
        .object({
            space_subdomain: CobotSpaceSubdomain,
            // space_link: z.string().url(),
            // name: z.string(),
            space_name: z.string(),
        })
        .array(),
});
export type CobotApiResponseGetUserDetails = z.infer<typeof CobotApiResponseGetUserDetails>;

// https://dev.cobot.me/api-docs/memberships#list-members
export const CobotApiResponseGetMemberships = z
    .object({
        id: CobotMembershipId,
        name: z.string(),
        email: z.string(),
    })
    .array();
export type CobotApiResponseGetMemberships = z.infer<typeof CobotApiResponseGetMemberships>;

export type CobotMembership = CobotApiResponseGetMemberships[number];

// https://dev.cobot.me/api-docs/navigation-links#list-navigation-links
export const CobotApiResponsePostNavigationLink = z.object({
    section: CobotNavigationLinkSection,
    label: z.string(),
    iframe_url: z.string().url(),
    url: z.string().url(),
    user_url: z.string().url(),
});

export type CobotApiResponsePostNavigationLink = z.infer<typeof CobotApiResponsePostNavigationLink>;
export const CobotApiResponseGetNavigationLinks = z.array(CobotApiResponsePostNavigationLink);
export const CobotApiRequestPostNavigationLinkBody = CobotApiResponsePostNavigationLink.pick({
    section: true,
    label: true,
    iframe_url: true,
});
export type CobotApiRequestPostNavigationLinkBody = z.infer<typeof CobotApiRequestPostNavigationLinkBody>;

// https://dev.cobot.me/api-docs/activities
export const CobotActivityLevel = z.enum(['ERROR', 'WARN', 'INFO']);
export type CobotActivityLevel = z.infer<typeof CobotActivityLevel>;

export const CobotActivityChannel = z.enum(['admin', 'membership']);
export type CobotActivityChannel = z.infer<typeof CobotActivityChannel>;

export const CobotActivityAttributes = z.record(z.union([z.string(), z.number(), z.boolean()]));
export type CobotActivityAttributes = z.infer<typeof CobotActivityAttributes>;

export const CobotApiResponseGetActivity = z.object({
    created_at: z.string(),
    type: z.string(),
    channels: z.array(CobotActivityChannel),
    attributes: CobotActivityAttributes.optional(),
    level: CobotActivityLevel.optional(),
});
export type CobotApiResponseGetActivity = z.infer<typeof CobotApiResponseGetActivity>;

export const CobotApiResponseGetActivities = z.array(CobotApiResponseGetActivity);
export type CobotApiResponseGetActivities = z.infer<typeof CobotApiResponseGetActivities>;

export const CobotApiRequestPostActivityBody = z.object({
    text: z.string(),
    level: CobotActivityLevel.optional(),
    channels: z.array(CobotActivityChannel),
    source_ids: z.array(z.string()).optional(),
});
export type CobotApiRequestPostActivityBody = z.infer<typeof CobotApiRequestPostActivityBody>;

// https://dev.cobot.me/api-docs/resources#list-resources
export const CobotResourceBookingTime = z.object({
    from: z.string(),
    to: z.string(),
    weekdays: z.array(z.number().min(1).max(7)),
});

export const CobotApiResponseGetResource = z.object({
    id: CobotResourceId,
    name: z.string(),
    price_per_hour: z.string(),
    tax_rate: z.string(),
    hidden: z.boolean(),
    capacity: z.number(),
    currency: z.string(),
    description: z.string().nullable(),
    cancellation_period: z.number(),
    can_book: z.boolean(),
    color: z.string().nullable(),
    photo: z.string().url().nullable(),
    min_booking_duration: z.number().nullable(),
    max_booking_duration: z.number().nullable(),
    booking_url: z.string().url(),
    booking_times: z.array(CobotResourceBookingTime),
});
export type CobotApiResponseGetResource = z.infer<typeof CobotApiResponseGetResource>;

export const CobotApiResponseGetResources = z.array(CobotApiResponseGetResource);
export type CobotApiResponseGetResources = z.infer<typeof CobotApiResponseGetResources>;

// https://dev.cobot.me/api-docs/bookings
export const CobotBookingMembership = z.object({
    id: CobotMembershipId,
    name: z.string(),
    email: z.string().email().optional(),
});
export type CobotBookingMembership = z.infer<typeof CobotBookingMembership>;

export const CobotBookingResource = z.object({
    id: CobotResourceId,
    name: z.string(),
    url: z.string().url().optional(),
});
export type CobotBookingResource = z.infer<typeof CobotBookingResource>;

export const CobotApiResponseGetBooking = z.object({
    id: CobotBookingId,
    from: z.string(), // ISO datetime
    to: z.string(), // ISO datetime
    title: z.string().nullable(),
    comments: z.string().nullable(),
    price: z.string(),
    currency: z.string(),
    paid: z.boolean().optional(),
    canceled: z.boolean().optional(),
    can_cancel: z.boolean().optional(),
    can_change: z.boolean().optional(),
    membership: CobotBookingMembership.nullable(),
    resource: CobotBookingResource,
    units: z.number().int().positive().optional(),
});
export type CobotApiResponseGetBooking = z.infer<typeof CobotApiResponseGetBooking>;

export const CobotApiResponseGetBookings = z.array(CobotApiResponseGetBooking);
export type CobotApiResponseGetBookings = z.infer<typeof CobotApiResponseGetBookings>;

export const CobotApiRequestPostBookingBody = z.object({
    from: z.string(), // ISO datetime
    to: z.string(), // ISO datetime
    title: z.string().optional(),
    comments: z.string().optional(),
    membership_id: CobotMembershipId.optional(),
    units: z.number().int().positive().optional(),
    price: z.number().optional(),
    has_custom_price: z.boolean().optional(),
    can_cancel: z.boolean().optional(),
    can_change: z.boolean().optional(),
});
export type CobotApiRequestPostBookingBody = z.infer<typeof CobotApiRequestPostBookingBody>;

export const CobotApiRequestPutBookingBody = CobotApiRequestPostBookingBody.partial();
export type CobotApiRequestPutBookingBody = z.infer<typeof CobotApiRequestPutBookingBody>;
