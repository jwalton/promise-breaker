/* eslint-disable @typescript-eslint/no-explicit-any */

import {
    AsyncParameters,
    AsyncReturnType,
    ThisParameter,
    Callback,
    VoidCallback,
} from './types.js';

/**
 * Given a function that expects a callback, return a new function that accepts a
 * callback or returns a promise depending on how it is called.
 *
 * This is similar to node.js's `util.promisify` but this will generate a function
 * that can be called with or without a callback, and will return a Promise either way.
 * Unlike the node version of `promisify`, this version will automatically
 * correctly handle the case where the function is being defined on an class.
 * Also, this version is typescript compatible with any function, where the the
 * `@types/node` definition only works with function with up to five parameters.
 *
 * `promisify` works by always adding a callback onto the list of arguments
 * passed down to your function.  If the caller doesn't pass a callback, this
 * added callback will be passed to your function, and will be used to resolve
 * or reject the returned `Promise`.  If the caller provides a callback, then
 * your function will get (and ignore) the extra callback that `promisify` adds
 * at the end.
 *
 * This works well in most cases, but can fall short for cases
 * where the underlying function takes a variable number of parameters. For these
 * cases, see `addPromise` which can be used to give you greater control.
 *
 * Technically the function will always return a Promise, regardless of whether or
 * not a callback is passed in, but if a callback is passed in the return Promise
 * will never resolve (instead we call into the callback).
 *
 * Note that if your async function throws an exception synchronously (instead
 * of returning it via the callback) then the promisified function will also
 * throw an exception synchronously.
 *
 * @param fn - The function to promisify.
 */
export function promisify<T extends (...args: any) => any>(
    fn: T
): {
    (...args: AsyncParameters<T>): Promise<AsyncReturnType<T>>;
    (...args: [...AsyncParameters<T>, Callback<AsyncReturnType<T>>]): void;
} {
    return function (this: any, ...args) {
        let resolve: (result: AsyncReturnType<T>) => void;
        let reject: (err: any) => void;
        const callbackPromise = new Promise<AsyncReturnType<T>>((res, rej) => {
            resolve = res;
            reject = rej;
        });

        const newArgs = [
            ...args,
            (err: any, value?: unknown) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(value as any);
                }
            },
        ];
        fn.apply(this, newArgs);

        return callbackPromise;
    };
}

export function callbackify<T extends (...args: any[]) => Promise<any>>(
    options: { args?: number },
    fn: T
): {
    (...args: AsyncParameters<T>): Promise<AsyncReturnType<T>>;
    (...args: [...AsyncParameters<T>, Callback<AsyncReturnType<T>>]): void;
};
export function callbackify<T extends (...args: any[]) => Promise<any>>(
    fn: T
): {
    (...args: AsyncParameters<T>): Promise<AsyncReturnType<T>>;
    (...args: [...AsyncParameters<T>, Callback<AsyncReturnType<T>>]): void;
};
/**
 * `callbackify` is the opposite of `promisify`; it takes a function that returns
 * a promise, and makes it so it can be called with either a promise or a callback.
 *
 * Callbackify works by calling the underlying function and then returning the
 * promise directly, or calling into the provided callback.
 *
 * In order for this to work, `callbackify` needs to detect if a callback was
 * included in the parameter list and remove it for the promise case. By default,
 * `callbackify` will always assume that if the last parameter passed in is a
 * function, then that function is a callback function. In most cases then you can do:
 *
 * ```js
 * const newFunc = callbackify(async function (foo, bar) => ...);
 * ```
 *
 * But, sometimes you might want to `callbackify` a function that takes a
 * non-callback function as it's final parameter.  In this case, you need to
 * specify the number of arguments the function you're trying to `callbackify`
 * expects:
 *
 * ```js
 * const newFunc = callbackify({ args: 2 }, async function(fn1, fn2) => ...);
 * ```
 *
 * @param [opts] - An `{args}` object specifying how many arguments your function
 *   expects.
 * @param fn - The async function to call.
 */
export function callbackify<T extends (...args: any[]) => Promise<any>>(
    p1: { args?: number } | T,
    p2?: T
): {
    (...args: AsyncParameters<T>): Promise<AsyncReturnType<T>>;
    (...args: [...AsyncParameters<T>, Callback<AsyncReturnType<T>>]): void;
} {
    let opts: { args?: number } | undefined;
    let fn: T;
    if (typeof p1 === 'object' && typeof p2 === 'function') {
        opts = p1;
        fn = p2;
    } else if (typeof p1 === 'function') {
        fn = p1;
    } else {
        throw new Error('Invalid arguments');
    }

    const fnLength = opts?.args;

    return function (this: any, ...args: any[]) {
        const callbackPresent =
            fnLength !== undefined
                ? args.length > fnLength
                : typeof args[args.length - 1] === 'function';

        if (callbackPresent) {
            const done = args[args.length - 1] as Callback<any>;
            const promise = fn.apply(this, args.slice(0, -1));
            promise.then(
                (result) => done(null, result),
                (err) => done(err, undefined)
            );
            return promise;
        } else {
            return fn.apply(this, args);
        }
    };
}

export function apply<T extends (...args: any) => any>(
    fn: T,
    thisArg: ThisParameter<T>,
    args?: AsyncParameters<T>
): Promise<AsyncReturnType<T>>;
export function apply<T extends (...args: any) => any>(
    fn: T,
    thisArg: ThisParameter<T>,
    args: AsyncParameters<T>,
    cb: Callback<AsyncReturnType<T>>
): void;
/**
 * `apply` is analagous to `Function.prototype.apply`, but you can use it to
 * call a function when you don't know in advance whether the function expects
 * a callback or will return a Promise. This is useful when writing a library
 * and you want to call into functions provided by your end user.
 *
 * @param fn - The function to call.
 * @param thisArg - The `this` parameter to provide to the function.
 * @param args - The parameters to pass to the function.  A callback function
 *   will automatically be added to this list of parameters.
 * @param [cb] - The callback function to call.
 * @returns - If the underlying `fn` returns a Promise, this will return that
 *   Promise.  Otherwise returns a Promise which will resolve or reject when the
 *   callback is called.
 */
export function apply<T extends (...args: any) => any>(
    fn: T,
    thisArg?: ThisParameter<T>,
    args?: AsyncParameters<T>,
    cb?: Callback<AsyncReturnType<T>>
): Promise<AsyncReturnType<T>> | undefined {
    if (cb) {
        const newArgs = [...(args || []), cb];
        const result = fn.apply(thisArg, newArgs);

        if (result && typeof result === 'object' && 'then' in result) {
            (result as Promise<AsyncReturnType<T>>).then(
                (result) => cb(null, result),
                (err) => cb(err, undefined as any)
            );
        }

        // Since we're using the callback, don't return a promise.
        return undefined;
    } else {
        let resolve: (result: AsyncReturnType<T>) => void;
        let reject: (err: any) => void;
        const callbackPromise = new Promise<AsyncReturnType<T>>((res, rej) => {
            resolve = res;
            reject = rej;
        });

        const newArgs = [
            ...(args || []),
            (err: any, value?: unknown) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(value as any);
                }
            },
        ];

        const result = fn.apply(thisArg, newArgs);

        if (result && typeof result === 'object' && 'then' in result) {
            // Use the returned promise.
            return result;
        } else {
            // Use the promise we created from the callback.
            return callbackPromise;
        }
    }
}

/**
 * `call` is analagous to `Function.prototype.call`.  See `apply` for details.
 *
 * @param fn - The function to call.
 * @param thisArg - The `this` parameter to provide to the function.
 * @param args - The parameters to pass to the function.  A callback function
 *   will automatically be added to this list of parameters.
 * @returns - If the underlying `fn` returns a Promise, this will return that
 *   Promise.  Otherwise returns a Promise which will resolve or reject when the
 *   callback is called.
 */
export function call<T extends (...args: any) => any>(
    fn: T,
    thisArg: ThisParameter<T>,
    ...args: AsyncParameters<T>
): Promise<AsyncReturnType<T>> {
    return apply(fn, thisArg, args);
}

/**
 * `callWithCb` is like `call`, but requires a callback instead of returning a Promise.
 *
 * @param fn - The function to call.
 * @param thisArg - The `this` parameter to provide to the function.
 * @param args - The parameters to pass to the function.  A callback function
 *   will automatically be added to this list of parameters.
 * @param cb - the callback to call when done.
 * @returns - If the underlying `fn` returns a Promise, this will return that
 *   Promise.  Otherwise returns a Promise which will resolve or reject when the
 *   callback is called.
 */
export function callWithCb<T extends (...args: any) => any>(
    fn: T,
    thisArg: ThisParameter<T>,
    ...args: [...AsyncParameters<T>, Callback<AsyncReturnType<T>>]
): void {
    const newArgs = args.slice(0, -1) as AsyncParameters<T>;
    const cb = args[args.length - 1];
    return apply(fn, thisArg, newArgs, cb);
}

export function addPromise(
    done: VoidCallback | null | undefined,
    fn: (done: VoidCallback) => void
): Promise<void> | undefined;
export function addPromise<R>(
    done: Callback<R> | null | undefined,
    fn: (done: Callback<R>) => void
): Promise<R> | undefined;
/**
 * Add a promise to a function that returns a callback.
 *
 * @example
 *     export function addNumbers(a: number, b: number): Promise<number>;
 *     export function addNumbers(a: number, b: number, done: Callback<number>): void;
 *     export function addNumbers(
 *         a: number,
 *         b: number,
 *         done?: Callback<number>
 *     ): Promise<number> | undefined {
 *         return addPromise(done, (done) => done(null, a + b));
 *     }
 *
 *     addNumbers(1, 2, (err, result) => console.log(result));
 *     addNumbers(1, 2).then((result) => console.log(result));
 *
 * @param done - The callback provided by your function's caller, or undefined if
 *   no callback was provided.
 * @param fn - A callback function to call as the implementation for your function.
 * @returns If a callback is provided, returns undefined. Otherwise returns a Promise.
 */
export function addPromise<R>(
    done: Callback<R> | VoidCallback | null | undefined,
    fn: (done: any) => void
): Promise<R> | undefined {
    if (done) {
        fn(done);
        return undefined;
    } else {
        return new Promise((resolve, reject) => {
            const callback = (err: any, result: R) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result as R);
                }
            };

            fn(callback);
        });
    }
}

export function addCallback(
    done: VoidCallback | null | undefined,
    promise: Promise<void> | (() => Promise<void>)
): Promise<void> | undefined;
export function addCallback<R>(
    done: Callback<R> | null | undefined,
    promise: Promise<R> | (() => Promise<R>) | (() => R)
): Promise<R> | undefined;
/**
 * Add a callback to a function that returns a promise.
 *
 * @example
 *     export function addNumbers(a: number, b: number): Promise<number>;
 *     export function addNumbers(a: number, b: number, done: Callback<number>): void;
 *     export function addNumbers(
 *         a: number,
 *         b: number,
 *         done?: Callback<number>
 *     ): Promise<number> | undefined {
 *         return addCallback(done, async () => return a + b);
 *     }
 *
 *     addNumbers(1, 2, (err, result) => console.log(result));
 *     addNumbers(1, 2).then((result) => console.log(result));
 *
 * @param done - The callback provided by your function's caller, or undefined if
 *   no callback was provided.
 * @param fn - An async function to call as the implementation for your function.
 * @returns If a callback is provided, returns undefined. Otherwise returns a Promise.
 */
export function addCallback<R>(
    done: Callback<R> | null | undefined,
    promise: Promise<R> | (() => Promise<R>) | (() => R)
): Promise<R> | undefined {
    let p: Promise<R>;

    if (!promise) {
        throw new Error('addCallback() expected promise or function as second paramater');
    } else if (typeof promise === 'object' && 'then' in promise) {
        p = promise;
    } else if (typeof promise === 'function') {
        p = Promise.resolve(promise());
    } else {
        throw new Error(`Don't know how to add a callback to ${typeof promise}`);
    }

    if (done) {
        p.then(
            (answer) => done(null, answer),
            (err) => done(err, undefined as R)
        );
        return undefined;
    }

    return p;
}

export { promisify as make, callbackify as break };

export type { VoidCallback, Callback, OptCallback } from './types.js';
