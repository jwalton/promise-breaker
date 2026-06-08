import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { addPromise } from './index.js';
import { describe, it } from 'mocha';

chai.use(chaiAsPromised);
const { expect } = chai;

describe('addPromise', () => {
    it('should add a promise to a callback function', async () => {
        function test(done: ((err: Error | null, value?: number) => void) | null = null) {
            return addPromise(done, (cb: (err: Error | null, value?: number) => void) => {
                cb(null, 7);
            });
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

    it('should handle an error', async () => {
        function test(done: ((err: Error | null, value?: number) => void) | null = null) {
            return addPromise(done, (cb: (err: Error | null, value?: number) => void) => {
                cb(new Error('boom'));
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
});
