import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from '../../src/services/request';

function MockXMLHttpRequestFactory({ isSuccessCase }: { isSuccessCase: boolean }): any {
  return class MockXMLHttpRequest {
    public status: number;
    public responseText: string;
    public headers: any = {};
    public headersCase: any = {};

    open(method: string, url: string): any {}
    send(): any {
      if (isSuccessCase) {
        this.onloadSuccess();
      } else {
        this.onloadFailure();
      }
    }

    onloadFailure(): void {
      this.status = 500;
      this.responseText = 'failure test case';
      this.onload();
    }

    onloadSuccess(): void {
      this.status = 200;
      this.responseText = 'success';
      this.onload();
    }

    onload(): any {}

    setRequestHeader(name: string, value: string): any {}
  };
}

describe('Services Request test suite', function () {
  let globalXhr;
  const MockXMLHttpRequestSuccess = MockXMLHttpRequestFactory({ isSuccessCase: true });
  const MockXMLHttpRequestFailure = MockXMLHttpRequestFactory({ isSuccessCase: false });

  beforeEach(function () {
    globalXhr = global.XMLHttpRequest;
    (global.XMLHttpRequest as any) = MockXMLHttpRequestSuccess;
  });

  afterEach(function () {
    vi.restoreAllMocks();
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
      openStub = vi.spyOn(MockXMLHttpRequestSuccess.prototype, 'open');
    });

    it('should upgrade the protocol to HTTPS', async function () {
      await request({
        url: 'http://www.test.com'
      });
      expect(openStub).toHaveBeenCalledWith('GET', 'https://www.test.com');
    });

    describe('and the forceHttp flag is true', function () {
      it('should maintain the protocol to HTTP', async function () {
        await request({
          url: 'http://www.test.com',
          forceHttp: true
        });
        expect(openStub).toHaveBeenCalledWith('GET', 'http://www.test.com');
      });
    });
  });

  describe('given a bearer token option is passed', function () {
    it('should set the header with the bearer token value', async function () {
      const setRequestHeaderStub = vi.spyOn(MockXMLHttpRequestSuccess.prototype, 'setRequestHeader');
      await request({
        url: 'https://www.test.com',
        'bearer-token': 'my-bearer-token'
      });
      expect(setRequestHeaderStub).toHaveBeenCalledWith('Authorization', 'Bearer my-bearer-token');
    });
  });

  describe('method option', function () {
    let openStub;

    beforeEach(function () {
      openStub = vi.spyOn(MockXMLHttpRequestSuccess.prototype, 'open');
    });

    describe('given a method option is passed', function () {
      it('should use the method to make the call', async function () {
        await request({
          url: 'https://www.test.com',
          method: 'POST'
        });
        expect(openStub).toHaveBeenCalledWith('POST', 'https://www.test.com');
      });
    });

    describe('given no method option is passed', function () {
      it('should default to the GET method to make the call', async function () {
        await request({
          url: 'https://www.test.com'
        });
        expect(openStub).toHaveBeenCalledWith('GET', 'https://www.test.com');
      });
    });
  });

  describe('body option', function () {
  let sendStub;

  beforeEach(function () {
    sendStub = vi.spyOn(MockXMLHttpRequestSuccess.prototype, 'send').mockImplementation(function () {
      // Simulate the request lifecycle by triggering the onload callback
      this.status = 200; // Simulate a successful response
      this.responseText = 'success'; // Simulate a response body
      this.onload();
    });
  });

  describe('given the body option is set', function () {
    it('should send the body', async function () {
      const body = {
        test: true
      };
      await request({
        url: 'https://www.test.com',
        body
      });
      expect(sendStub).toHaveBeenCalledWith(JSON.stringify(body));
    });
  });

  describe('given the body option is not set', function () {
    it('should send nothing', async function () {
      await request({
        url: 'https://www.test.com'
      });
      expect(sendStub).toHaveBeenCalledWith();
    });
  });
});

  describe('onload method', function () {
    describe('given the response status is 2xx', function () {
      it('should resolve the responseText', async function () {
        const response = await request({
          url: 'https://www.test.com'
        });
        expect(response).toBe('success');
      });
    });

    describe('given the response status is not 2xx', function () {
      it('should reject the request with the error code', async function () {
        (global.XMLHttpRequest as any) = MockXMLHttpRequestFailure;
        await expect(async () => {
          await request({
            url: 'https://www.test.com'
          });
        }).rejects.toEqual(new Error('Error fetching url:https://www.test.com; status code:500'));
      });
    });
  });
});
