const getEnvVar = (name: string): string => {
    const variable = process.env[name];
    if (variable === undefined || variable === '') {
        throw new Error(`Environment variable ${variable} is required but not present`);
    }
    return variable;
};

export const DB_URI = getEnvVar('DB_URI');

export const COBOT_CLIENT_ID = getEnvVar('COBOT_CLIENT_ID');
export const COBOT_CLIENT_SECRET = getEnvVar('COBOT_CLIENT_SECRET');
