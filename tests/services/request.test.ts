import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from '../../src/services/request';

function createFetchResponse({
  ok,
  status,
  responseText
}: {
  ok: boolean;
  status: number;
  responseText: string;
}): Response {
  return {
    ok,
    status,
    text: vi.fn().mockResolvedValue(responseText)
  } as unknown as Response;
}

describe('Services Request test suite', function () {
  const originalFetch = global.fetch;

  beforeEach(function () {
    global.fetch = vi.fn().mockResolvedValue(
      createFetchResponse({
        ok: true,
        status: 200,
        responseText: 'success'
      })
    );
  });

  afterEach(function () {
    vi.restoreAllMocks();
    global.fetch = originalFetch;
  });

  describe('given it is called without a URL', function () {
    it('should throw an error', async function () {
      await expect(request({} as any)).rejects.toThrow('URL is missing');
    });
  });

  describe('given the URL is HTTP', function () {
    it('should upgrade the protocol to HTTPS', async function () {
      await request({
        url: 'http://www.test.com'
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://www.test.com',
        expect.objectContaining({
          method: 'GET'
        })
      );
    });

    describe('and the forceHttp flag is true', function () {
      it('should maintain the protocol to HTTP', async function () {
        await request({
          url: 'http://www.test.com',
          forceHttp: true
        });

        expect(global.fetch).toHaveBeenCalledWith(
          'http://www.test.com',
          expect.objectContaining({
            method: 'GET'
          })
        );
      });
    });
  });

  describe('given a bearer token option is passed', function () {
    it('should set the header with the bearer token value', async function () {
      await request({
        url: 'https://www.test.com',
        'bearer-token': 'my-bearer-token'
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://www.test.com',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer my-bearer-token'
          }
        })
      );
    });
  });

  describe('method option', function () {
    describe('given a method option is passed', function () {
      it('should use the method to make the call', async function () {
        await request({
          url: 'https://www.test.com',
          method: 'POST'
        });

        expect(global.fetch).toHaveBeenCalledWith(
          'https://www.test.com',
          expect.objectContaining({
            method: 'POST'
          })
        );
      });
    });

    describe('given no method option is passed', function () {
      it('should default to the GET method to make the call', async function () {
        await request({
          url: 'https://www.test.com'
        });

        expect(global.fetch).toHaveBeenCalledWith(
          'https://www.test.com',
          expect.objectContaining({
            method: 'GET'
          })
        );
      });
    });
  });

  describe('body option', function () {
    describe('given the body option is set', function () {
      it('should send the body as JSON and set the content type header', async function () {
        const body = {
          test: true
        };

        await request({
          url: 'https://www.test.com',
          body
        });

        expect(global.fetch).toHaveBeenCalledWith(
          'https://www.test.com',
          expect.objectContaining({
            method: 'GET',
            body: JSON.stringify(body),
            headers: {
              'Content-Type': 'application/json'
            }
          })
        );
      });
    });

    describe('given the body option is not set', function () {
      it('should send no body', async function () {
        await request({
          url: 'https://www.test.com'
        });

        expect(global.fetch).toHaveBeenCalledWith(
          'https://www.test.com',
          expect.objectContaining({
            method: 'GET',
            body: undefined
          })
        );
      });
    });
  });

  describe('response handling', function () {
    describe('given the response status is 2xx', function () {
      it('should resolve the response text', async function () {
        const response = await request({
          url: 'https://www.test.com'
        });

        expect(response).toBe('success');
      });
    });

    describe('given the response status is not 2xx', function () {
      it('should reject the request with the error code', async function () {
        global.fetch = vi.fn().mockResolvedValue(
          createFetchResponse({
            ok: false,
            status: 500,
            responseText: 'failure test case'
          })
        );

        await expect(
          request({
            url: 'https://www.test.com'
          })
        ).rejects.toEqual(
          new Error('Error fetching url:https://www.test.com; status code:500')
        );
      });
    });

    describe('given fetch rejects', function () {
      it('should reject with the fetch error message', async function () {
        global.fetch = vi.fn().mockRejectedValue(new Error('network failure'));

        await expect(
          request({
            url: 'https://www.test.com'
          })
        ).rejects.toEqual(new Error('network failure'));
      });
    });
  });
});
