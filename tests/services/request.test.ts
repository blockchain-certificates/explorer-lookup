import request from '../../src/services/request';
import sinon from 'sinon';

class MockXMLHttpRequest {
  public status: number;
  public headers: any = {};
  public headersCase: any = {};

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

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setRequestHeader (name: string, value: string): any {}
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
    let openStub;

    beforeEach(function () {
      // @ts-expect-error open takes params but does not pick them up from the class definition and TS complains...
      openStub = sinon.stub<[string, string]>(MockXMLHttpRequest.prototype, 'open');
    });

    it('should upgrade the protocol to HTTPS', async function () {
      await request({
        url: 'http://www.test.com'
      });
      expect(openStub.getCall(0).args[1]).toBe('https://www.test.com');
    });

    describe('and the forceHttp flag is true', function () {
      it('should maintain the protocol to HTTP', async function () {
        await request({
          url: 'http://www.test.com',
          forceHttp: true
        });
        expect(openStub.getCall(0).args[1]).toBe('http://www.test.com');
      });
    });
  });

  describe('given a bearer token option is passed', function () {
    it('should set the header with the bearer token value', async function () {
      // @ts-expect-error open takes params but does not pick them up from the class definition and TS complains...
      const setRequestHeaderStub = sinon.stub<[string, string]>(MockXMLHttpRequest.prototype, 'setRequestHeader');
      await request({
        url: 'http://www.test.com',
        'bearer-token': 'my-bearer-token'
      });
      expect(setRequestHeaderStub.getCall(0).args).toEqual(['Authorization', 'Bearer my-bearer-token']);
    });
  });
});
