import { runPromiseRace } from '../../src/lookForTx';
import { type TransactionData } from '../../src/models/transactionData';

describe('runPromiseRace test suite', function () {
    const validTx: TransactionData = {
        revokedAddresses: [],
        time: '2020-04-20T00:00:00Z',
        remoteHash: 'a-remote-hash',
        issuingAddress: 'an-issuing-address'
    };

    const invalidTx: TransactionData = {
        time: undefined,
        issuingAddress: undefined,
        remoteHash: undefined,
        revokedAddresses: [],
    }

    it('fails when no promises were created', function () {
        const racePromise = runPromiseRace([]);
        expect(async function () {
            await racePromise;
        }).rejects.toThrow('No explorers configured');

    });

    it('resolves as soon as the first valid response is returned', async function () {
        let resolveFast: (v: TransactionData) => void;
        let resolveSlow: (v: TransactionData) => void;

        const fast = new Promise<TransactionData>(res => {
            resolveFast = res;
        });
        const slow = new Promise<TransactionData>(res => {
            resolveSlow = res;
        });
        const racePromise = runPromiseRace([fast, slow]);

        resolveFast(validTx);
        const result = await racePromise;
        expect(result).toBe(validTx);

        const tx = {
            ...validTx,
            time: '2020-04-20T00:00:01Z',
        }
        resolveSlow(tx);
    });

    it('ignores early failures while all the requests have not finished', async function () {
        let resolveFast: (v: TransactionData) => void;
        let resolveSlow: (v: TransactionData) => void;

        const fast = new Promise<TransactionData>((res, reject) => {
            resolveFast = reject;
        });
        const slow = new Promise<TransactionData>(res => {
            resolveSlow = res;
        });
        const racePromise = runPromiseRace([fast, slow]);

        resolveFast({
            time: undefined,
            issuingAddress: undefined,
            remoteHash: undefined,
            revokedAddresses: [],
        });

        resolveSlow(validTx);
        const result = await racePromise;
        expect(result).toBe(validTx);
    });

    it('fails when all the requests fail', async function () {
        let resolveFast: (v: TransactionData) => void;
        let resolveSlow: (v: TransactionData) => void;

        const fast = new Promise<TransactionData>((res, reject) => {
            resolveFast = reject;
        });
        const slow = new Promise<TransactionData>((res, reject) => {
            resolveSlow = reject;
        });
        const racePromise = runPromiseRace([fast, slow]);

        resolveFast(invalidTx);

        resolveSlow(invalidTx);

        expect(async function () {
            await racePromise;
        }).rejects.toThrow('Could not confirm transaction data.');
    });
});
