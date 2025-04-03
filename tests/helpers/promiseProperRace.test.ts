import { describe, it, expect } from 'vitest';
import PromiseProperRace from '../../src/helpers/promiseProperRace';

describe('PromiseProperRace', function () {
  it('throws error when number of promises is less than count argument', async function () {
    const promises = [Promise.resolve(1), Promise.resolve(2)];
    await expect(async () => await PromiseProperRace(promises, 3))
      .rejects.toThrow('Could not retrieve tx data');
  });

  it('resolves successfully when promises resolve', async function () {
    const promises = [Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)];
    await expect(PromiseProperRace(promises, 3)).resolves.toEqual([1, 2, 3]);
  });

  it('resolves successfully when some promises reject', async function () {
    const promises = [Promise.resolve(1), Promise.reject(new Error('rejected')), Promise.resolve(3)];
    const result = await PromiseProperRace(promises, 2);
    expect(result).toEqual([1, 3]);
  });

  it('rejects when all promises reject', async function () {
    const promises = [Promise.reject(new Error('error')), Promise.reject(new Error('error')), Promise.reject(new Error('error'))];
    await expect(PromiseProperRace(promises, 3)).rejects.toEqual(
      new Error('Could not retrieve tx data')
    );
  });
});
