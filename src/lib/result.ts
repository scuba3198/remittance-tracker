export type Result<T, E> =
    | { success: true; value: T }
    | { success: false; error: E };

export const Result = {
    ok: <T>(value: T): Result<T, never> => ({ success: true, value }),
    err: <E>(error: E): Result<never, E> => ({ success: false, error }),
};
