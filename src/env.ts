const getEnvVar = (name: string, howToGet: string): string => {
    const variable = process.env[name];
    if (variable === undefined || variable === '') {
        throw new Error(`Environment variable ${variable} is required but not present. ${howToGet}`);
    }
    return variable;
};

export const DB_URI = getEnvVar('DB_URI', 'Currently, only a local file like file:./database.json is supported');

export const IRON_PASSWORD = getEnvVar(
    'IRON_PASSWORD',
    `Run to generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`,
);

export const COBOT_CLIENT_ID = getEnvVar(
    'COBOT_CLIENT_ID',
    'Create an OAuth client at https://dev.cobot.me/oauth2_clients',
);
export const COBOT_CLIENT_SECRET = getEnvVar(
    'COBOT_CLIENT_SECRET',
    'Create an OAuth client at https://dev.cobot.me/oauth2_clients',
);
export const CFOS_BASE_URL = getEnvVar('CFOS_BASE_URL', '');
