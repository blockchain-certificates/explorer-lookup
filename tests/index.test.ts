import { lookForTx } from '../src';

describe('lookForTx test suite', function () {
  it('returns true', function () {
    const output = lookForTx();
    expect(output).toBe(true);
  });
});
