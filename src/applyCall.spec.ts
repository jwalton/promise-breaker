import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import * as pb from '../src/index.js';
import { describe, it } from 'mocha';
import { expectType } from 'tsd';

chai.use(chaiAsPromised);
const { expect } = chai;

describe('call', () => {
    it('should work for a function that expects a callback', async () => {
        const thisObj = {};
        const fn = function (this: unknown, x: number, y: number, done: pb.Callback<number>) {
            try {
                expect(this).to.equal(thisObj);
                done(null, x + y);
            } catch (err) {
                done(err, 0);
            }
        };

        const result = await pb.call(fn, thisObj, 2, 4);
        expectType<number>(result);
        expect(result).to.equal(6);
    });

    it('should work for a function that expects a callback, and returns an error', async () => {
        const fn = (_x: number, _y: number, done: pb.VoidCallback) => {
            done(new Error('foo'));
        };

        const result = pb.call(fn, null, 2, 4);
        expectType<Promise<void>>(result);
        return await expect(result).to.be.rejectedWith('foo');
    });

    it('should expect the correct arguments', async () => {
        function fn(this: string, x: number, y: number, done: pb.VoidCallback) {
            done();
        }

        try {
            // @ts-expect-error this has a string as the second argument, and we expect a number.
            await pb.call(fn, 'this', 2, 'string');
        } catch {
            /* ignore */
        }

        try {
            // @ts-expect-error this is missing the second argument.
            await pb.call(fn, 'this', 2);
        } catch {
            /* ignore */
        }

        try {
            // @ts-expect-error wrong type for `this` argument.
            await pb.call(fn, 7, 2, 4);
        } catch {
            /* ignore */
        }
    });

    it('should work for a function that returns a promise', async () => {
        const fn = () => Promise.resolve('hello');

        const result = await pb.call(fn, null);
        expectType<string>(result);
        expect(result).to.equal('hello');
    });
});

describe('callWithCb', () => {
    it('should work for a function that expects a callback', async () => {
        const thisObj = {};
        const fn = function (this: unknown, x: number, y: number, done: pb.Callback<number>) {
            try {
                expect(this).to.equal(thisObj);
                done(null, x + y);
            } catch (err) {
                done(err, 0);
            }
        };

        const result = await new Promise<number>((resolve) => {
            pb.callWithCb(fn, thisObj, 2, 4, (err, v) => resolve(v));
        });
        expect(result).to.equal(6);
    });

    it('should work for a function that returns a promise', async () => {
        const fn = () => Promise.resolve('hello');

        const result = await new Promise<string>((resolve) => {
            pb.callWithCb(fn, null, (err, v) => resolve(v));
        });
        expect(result).to.equal('hello');
    });
});

describe('apply', () => {
    it('should work for a function that expects a callback', async () => {
        const thisObj = {};
        const fn = function (this: unknown, x: number, y: number, done: pb.Callback<number>) {
            try {
                expect(this).to.equal(thisObj);
                done(null, x + y);
            } catch (err) {
                done(err, 0);
            }
        };

        const result = await pb.apply(fn, thisObj, [2, 4]);
        expectType<number>(result);
        expect(result).to.equal(6);
    });

    it('should work for a function that expects a callback, and returns an error', async () => {
        const fn = (x: number, y: number, done: pb.VoidCallback) => {
            done(new Error('foo'));
        };

        const result = pb.apply(fn, null, [2, 4]);
        expectType<Promise<void>>(result);
        return await expect(result).to.be.rejectedWith('foo');
    });

    it('should expect the correct arguments', async () => {
        function fn(this: string, x: number, y: number, done: pb.VoidCallback) {
            done();
        }

        try {
            // @ts-expect-error this has a string as the second argument, and we expect a number.
            await pb.apply(fn, 'this', [2, 'string']);
        } catch {
            /*ignore */
        }

        try {
            // @ts-expect-error this is missing the second argument.
            await pb.apply(fn, 'this', [2]);
        } catch {
            /*ignore */
        }

        try {
            // @ts-expect-error wrong type for `this` argument.
            await pb.apply(fn, 7, [2, 4]);
        } catch {
            /*ignore */
        }
    });

    it('should work for a function that returns a promise', async () => {
        const fn = () => Promise.resolve('hello');

        const result = await pb.apply(fn, null);
        expectType<string>(result);
        expect(result).to.equal('hello');
    });
});
