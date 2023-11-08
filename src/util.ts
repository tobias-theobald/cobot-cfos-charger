export const logErrorAndReturnCleanMessage = (cleanMessage: string, error: unknown): { ok: false; error: string } => {
    console.error(cleanMessage, error);
    return { ok: false, error: cleanMessage };
};
