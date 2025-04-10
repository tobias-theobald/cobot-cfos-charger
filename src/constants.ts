export const COBOT_OAUTH_ADMIN_SCOPES = [
    'navigation',
    'read_user',
    'read_memberships',
    'read_resources',
    'write_activities',
    'read_bookings',
    'write_bookings',
];
export const COBOT_OAUTH_USER_SCOPES = ['read_user'];

export const COBOT_NAVIGATION_ITEMS = [
    {
        section: 'admin/manage',
        label: 'EV Chargers',
        iframe_url: '/cobot-iframe',
    },
];

export const USER_DETAILS_CACHE_TTL_MS = 60 * 1000; // 1 minute

export const BOOKING_DURATION_AT_START = 8 * 60 * 60 * 1000; // 8 hours

export const MEMBERSHIP_ID_NOBODY = '__nobody';
