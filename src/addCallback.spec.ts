import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { addCallback } from './index.js';
import { describe, it } from 'mocha';

chai.use(chaiAsPromised);
const { expect } = chai;

describe('addCallback', () => {
    it('should add a callback to an async function', async () => {
        function test(done: ((err: Error | null, value?: number) => void) | null = null) {
            return addCallback(done, async () => 7);
        }

        // Should work when awaited.
        const result = await test();
        expect(result, 'promise based').to.equal(7);

        // Should work with a callback.
        const cbResult = await new Promise((res, rej) => {
            test((err, value) => {
                if (err) {
                    rej(err);
                } else {
                    res(value);
                }
            });
        });
        expect(cbResult, 'callback based').to.equal(7);
    });

    it('should add a callback to a sync function', async () => {
        function test(done: ((err: Error | null, value?: number) => void) | null = null) {
            return addCallback(done, () => 7);
        }

        // Should work when awaited.
        const result = await test();
        expect(result, 'promise based').to.equal(7);

        // Should work with a callback.
        const cbResult = await new Promise((res, rej) => {
            test((err, value) => {
                if (err) {
                    rej(err);
                } else {
                    res(value);
                }
            });
        });
        expect(cbResult, 'callback based').to.equal(7);
    });

    it('should add a callback to a promise', async () => {
        function test(done: ((err: Error | null, value?: number) => void) | null = null) {
            return addCallback(done, Promise.resolve(7));
        }

        // Should work when awaited.
        const result = await test();
        expect(result, 'promise based').to.equal(7);

        // Should work with a callback.
        const cbResult = await new Promise((res, rej) => {
            test((err, value) => {
                if (err) {
                    rej(err);
                } else {
                    res(value);
                }
            });
        });
        expect(cbResult, 'callback based').to.equal(7);
    });

    it('should handle an error from an async function', async () => {
        function test(done: ((err: Error | null, value?: number) => void) | null = null) {
            return addCallback(done, async () => {
                throw new Error('boom');
            });
        }

        await expect(test(), 'promise based').to.be.rejectedWith('boom');

        await expect(
            new Promise((res, rej) => {
                test((err, value) => {
                    if (err) {
                        rej(err);
                    } else {
                        res(value);
                    }
                });
            }),
            'callback based'
        ).to.be.rejectedWith('boom');
    });

    it('should handle an error from a promise', async () => {
        function test(done: ((err: Error | null, value?: number) => void) | null = null) {
            return addCallback(done, Promise.reject(Error('boom')));
        }

        await expect(test(), 'promise based').to.be.rejectedWith('boom');

        await expect(
            new Promise((res, rej) => {
                test((err, value) => {
                    if (err) {
                        rej(err);
                    } else {
                        res(value);
                    }
                });
            }),
            'callback based'
        ).to.be.rejectedWith('boom');
    });
});
