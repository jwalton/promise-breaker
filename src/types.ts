/* eslint-disable @typescript-eslint/no-explicit-any */

export interface VoidCallback {
    (err?: any): void;
}

export interface Callback<R> {
    (err: any | null, v: R): void;
}

// TODO: Can I remove OptCallback?
export interface OptCallback<R> {
    (err: any | null, v?: R): void;
}

/**
 * Resolves to the return type of a function that may return a value directly,
 * via a Promise, or via a trailing node-style callback. A Promise return is
 * preferred when both are present.
 */
export type AsyncReturnType<T extends (...args: any) => any> = T extends (...args: infer P) => never
    ? never
    : T extends (...args: any[]) => Promise<infer R>
      ? R
      : T extends (...args: infer P) => infer Ret
        ? P extends [...any[], (...cbArgs: infer CB) => any]
            ? // A trailing callback: derive the value from its parameters. A
              // single-parameter callback (just `err`) carries no value, so the
              // resolved type is `void`.
              CB['length'] extends 1
                ? void
                : CB extends [any, infer R, ...any[]]
                  ? R
                  : CB extends [any, (infer R)?, ...any[]]
                    ? R
                    : void
            : Ret
        : never;

/** Returns the parameters of a function as a tuple, not including the optional callback. */
export type AsyncParameters<T extends (...args: any) => any> = T extends (...args: infer P) => never
    ? P extends [...infer Rest, VoidCallback]
        ? Rest
        : P extends [...infer Rest, Callback<any>]
          ? Rest
          : P extends [...infer Rest, OptCallback<any>]
            ? Rest
            : P
    : T extends (...args: infer P) => Promise<any>
      ? P
      : T extends (...args: infer P) => any
        ? P extends [...infer Rest, VoidCallback]
            ? Rest
            : P extends [...infer Rest, Callback<any>]
              ? Rest
              : P extends [...infer Rest, OptCallback<any>]
                ? Rest
                : P
        : never;

export type ThisParameter<T extends (...args: any) => any> = T extends (
    this: infer THIS,
    ...args: infer _P
) => any
    ? THIS
    : void;
