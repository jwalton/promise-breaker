import { describe } from 'mocha';
import type { AsyncParameters, AsyncReturnType } from './types.js';
import { expectType } from 'tsd';

async function _noArgs(): Promise<string> {
    return 'foo';
}

async function _args(_x: string, _b: number): Promise<string> {
    return 'foo';
}

async function _voidFn(): Promise<void> {}

function _noArgsCallback(cb: (e: Error | null, value: string) => void) {
    cb(null, 'foo');
}

function _argsCallback(_x: string, _b: number, cb: (e: Error | null, value: string) => void) {
    cb(null, 'foo');
}

function _noArgsOptCallback(cb: (e: Error | null, value?: string) => void) {
    cb(null, 'foo');
}

function _argsOptCallback(_x: string, _b: number, cb: (e: Error | null, value?: string) => void) {
    cb(null, 'foo');
}

function _voidCallback(cb: (e: Error | null) => void) {
    cb(null);
}

const _neverCallback = (_cb: (e: Error | null, value: string) => void) => {
    throw new Error('error');
};

function _notAsyncNoArgs(): string {
    return 'foo';
}

function _notAsyncArgs(_x: string, _b: number): string {
    return 'foo';
}

function _notAsyncVoidFn(): void {}

describe('types tests', () => {
    describe('AsyncReturnType', () => {
        it('should find the correct return type for different functions', () => {
            const noArgsReturn: AsyncReturnType<typeof _noArgs> = 'foo';
            expectType<string>(noArgsReturn);

            const argsReturn: AsyncReturnType<typeof _args> = 'foo';
            expectType<string>(argsReturn);

            const voidReturn: AsyncReturnType<typeof _voidFn> = undefined;
            expectType<void>(voidReturn);

            const noArgsCbReturn: AsyncReturnType<typeof _noArgsCallback> = 'foo';
            expectType<string>(noArgsCbReturn);

            const argsCbReturn: AsyncReturnType<typeof _argsCallback> = 'foo';
            expectType<string>(argsCbReturn);

            const noArgsOptCbReturn: AsyncReturnType<typeof _noArgsOptCallback> = 'foo';
            expectType<string>(noArgsOptCbReturn);

            const argsOptCbReturn: AsyncReturnType<typeof _argsOptCallback> = 'foo';
            expectType<string>(argsOptCbReturn);

            const voidCbReturn: AsyncReturnType<typeof _voidCallback> = undefined;
            expectType<void>(voidCbReturn);

            try {
                const _neverCbReturn: AsyncReturnType<typeof _neverCallback> = (() => {
                    throw new Error('boom');
                })();
            } catch {
                /** ignore */
            }

            const notAsyncNoArgsReturn: AsyncReturnType<typeof _notAsyncNoArgs> = 'foo';
            expectType<string>(notAsyncNoArgsReturn);

            const notAsyncArgsReturn: AsyncReturnType<typeof _notAsyncArgs> = 'foo';
            expectType<string>(notAsyncArgsReturn);

            const notAsyncVoidReturn: AsyncReturnType<typeof _notAsyncVoidFn> = undefined;
            expectType<void>(notAsyncVoidReturn);
        });
    });

    describe('AsyncParameters', () => {
        it('should find the correct parameters for different functions', () => {
            const noArgsParams: AsyncParameters<typeof _noArgs> = [];
            expectType<[]>(noArgsParams);

            const argsParams: AsyncParameters<typeof _args> = ['foo', 2];
            expectType<[string, number]>(argsParams);

            const voidParams: AsyncParameters<typeof _voidFn> = [];
            expectType<[]>(voidParams);

            const noArgsCbParams: AsyncParameters<typeof _noArgsCallback> = [];
            expectType<[]>(noArgsCbParams);

            const argsCbParams: AsyncParameters<typeof _argsCallback> = ['foo', 2];
            expectType<[string, number]>(argsCbParams);

            const voidCbParams: AsyncParameters<typeof _voidCallback> = [];
            expectType<[]>(voidCbParams);

            const neverCbReturn: AsyncParameters<typeof _neverCallback> = [];
            expectType<[]>(neverCbReturn);

            const notAsyncNoArgsParams: AsyncParameters<typeof _notAsyncNoArgs> = [];
            expectType<[]>(notAsyncNoArgsParams);

            const notAsyncArgsParams: AsyncParameters<typeof _notAsyncArgs> = ['foo', 2];
            expectType<[string, number]>(notAsyncArgsParams);

            const notAsyncVoidParams: AsyncParameters<typeof _notAsyncVoidFn> = [];
            expectType<[]>(notAsyncVoidParams);
        });
    });
});
