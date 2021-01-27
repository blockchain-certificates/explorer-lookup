import { XMLHttpRequest as xhrPolyfill } from 'xmlhttprequest';

export interface RequestParameters {
  url: string;
  method?: 'GET' | 'POST';
  body?: any;
}

// TODO: not tested
export async function request (obj: RequestParameters): Promise<string> {
  return await new Promise((resolve, reject) => {
    const url = obj.url;

    if (!url) {
      reject(new Error('URL is missing'));
    }

    // server
    const XHR = typeof XMLHttpRequest === 'undefined' ? xhrPolyfill : XMLHttpRequest;
    const request: XMLHttpRequest = new XHR();

    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        resolve(request.responseText);
      } else {
        console.log(request.responseText);
        const failureMessage: string = `Error fetching url:${url}; status code:${request.status}`;
        reject(new Error(failureMessage));
      }
    };

    request.ontimeout = (e) => {
      console.log('ontimeout', e);
    };

    request.onreadystatechange = () => {
      if (request.status === 404) {
        reject(new Error(`Error fetching url:${url}; status code:${request.status}`));
      }
    };

    request.onerror = () => {
      console.error(`Request failed with error ${request.responseText}`);
      reject(new Error(request.responseText));
    };

    request.open(obj.method || 'GET', url);

    if (obj.body) {
      request.send(JSON.stringify(obj.body));
    } else {
      request.send();
    }
  });
}
