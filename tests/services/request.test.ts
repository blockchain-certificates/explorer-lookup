import request from '../../src/services/request';
import sinon from 'sinon';

class MockXMLHttpRequest {
  public status: number;
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  open (method: string, url: string): any {}
  send (): any {
    this.onloadSuccess();
  }

  onloadSuccess (): any {
    this.status = 200;
    this.onload();
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onload (): any {}
}

describe('Services Request test suite', function () {
  let globalXhr;

  beforeEach(function () {
    globalXhr = global.XMLHttpRequest;
    (global.XMLHttpRequest as any) = MockXMLHttpRequest;
  });

  afterEach(function () {
    sinon.restore();
    global.XMLHttpRequest = globalXhr;
  });

  describe('given it is called without a URL', function () {
    it('should throw an error', async function () {
      await request({} as any).catch(err => {
        expect(err.message).toBe('URL is missing');
      });
    });
  });

  describe('given the URL is HTTP', function () {
    it('should upgrade the protocol to HTTPS', async function () {
      // @ts-expect-error open takes params but does not pick them up from the class definition and TS complains...
      const openStub = sinon.stub<[string, string]>(MockXMLHttpRequest.prototype, 'open');
      await request({
        url: 'http://www.test.com'
      });
      expect(openStub.getCall(0).args[1]).toBe('https://www.test.com');
    });

    describe('and the forceHttp flag is true', function () {
      it('should maintain the protocol to HTTP', async function () {
        // @ts-expect-error open takes params but does not pick them up from the class definition and TS complains...
        const openStub = sinon.stub<[string, string]>(MockXMLHttpRequest.prototype, 'open');
        await request({
          url: 'http://www.test.com',
          forceHttp: true
        });
        expect(openStub.getCall(0).args[1]).toBe('http://www.test.com');
      });
    });
  });
});
