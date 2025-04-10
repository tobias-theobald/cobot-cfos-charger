export const COBOT_OAUTH_ADMIN_SCOPES = [
    'navigation',
    'read_accounting_codes',
    'write_charges',
    'read_user',
    'read_memberships',
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

export const USER_DETAILS_CACHE_TTL_MS = 1000 * 60; // 1 minute

export const MEMBERSHIP_ID_NOBODY = '__nobody';
