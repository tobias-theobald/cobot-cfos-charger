export type ValueOrError<T> = { ok: true; value: T } | { ok: false; error: string };
export type ExtractValue<T> = T extends { ok: true; value: infer U } ? U : never;
