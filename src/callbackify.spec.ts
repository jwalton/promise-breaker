import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { callbackify } from './index.js';
import { describe, it } from 'mocha';

chai.use(chaiAsPromised);
const { expect } = chai;

describe('callbackify', () => {
    it('should add a promise to a callback function', async () => {
        const test = callbackify(async () => 7);

        // Should work when awaited.
        const result = await test();
        expect(result, 'promise based').to.equal(7);

        // Should work with a callback.
        const cbResult = await new Promise((resolve) => {
            test((_err, value) => resolve(value));
        });
        expect(cbResult, 'callback based').to.equal(7);
    });

    it('should add a promise to a callback function that takes a function', async () => {
        const test = callbackify({ args: 1 }, async (fn: () => number) => fn());

        // Should work when awaited.
        const result = await test(() => 7);
        expect(result, 'promise based').to.equal(7);

        // Should work with a callback.
        const cbResult = await new Promise((resolve) => {
            test(
                () => 7,
                (_err, value) => resolve(value)
            );
        });
        expect(cbResult, 'callback based').to.equal(7);
    });

    it('should handle an error', async () => {
        const test = callbackify(async () => {
            throw new Error('boom');
        });

        await expect(test(), 'promise based').to.be.rejectedWith('boom');

        await expect(
            new Promise((resolve, reject) => {
                test((err) => reject(err));
            }),
            'callback based'
        ).to.be.rejectedWith('boom');
    });

    /// Functions that used to throw synchronously will continue to do so.
    it('should handle a function that throws synchronously', async () => {
        const test = callbackify((): Promise<number> => {
            throw new Error('boom');
        });

        // TODO: Do we want to do this, or do we want to conver the synchronous exception into the promise?
        // If it's part of the promise, then it'll become an unhandled rejection
        // in the callback case.  Maybe we should pass the arg count here like we do
        // in callbackify so we can handle this better?  Does callbackify handle
        // a synchronous throw from a promise-returning function any better?
        expect(() => test()).to.throw('boom');

        expect(() => test((err) => console.log(err))).to.throw('boom');
    });
    it('should handle this in class method', async () => {
        class Foo {
            value = 7;

            fn = callbackify(async function (this: Foo) {
                return this.value;
            });
        }
        const foo = new Foo();

        const v = await foo.fn();
        expect(v).to.equal(7);

        const v2 = await new Promise((resolve) => {
            foo.fn((_err, v) => resolve(v));
        });
        expect(v2).to.equal(7);
    });

    it('should handle this in class arrow method', async () => {
        class Foo {
            value = 7;

            fn = callbackify(async () => {
                return this.value;
            });
        }
        const foo = new Foo();

        const v = await foo.fn();
        expect(v).to.equal(7);

        const v2 = await new Promise((resolve) => {
            foo.fn((_err, v) => resolve(v));
        });
        expect(v2).to.equal(7);
    });

    it('should work with bind', async () => {
        const obj = {
            value: 7,
        };
        const fn = callbackify(async function (this: { value: number }) {
            return this.value;
        }).bind(obj);

        const v = await fn();
        expect(v).to.equal(7);

        const v2 = await new Promise((resolve) => {
            fn((_err, v) => resolve(v));
        });
        expect(v2).to.equal(7);
    });
});
