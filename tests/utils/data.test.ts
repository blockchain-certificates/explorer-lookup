import { toUTF8Data } from '../../src/utils/data';

describe('toUTF8Data method', function () {
  describe('given a string', function () {
    it('should return a UTF8 encoded array from the characters', function () {
      const output = toUTF8Data('test');
      expect(output).toEqual([116, 101, 115, 116]);
    });
  });
});
