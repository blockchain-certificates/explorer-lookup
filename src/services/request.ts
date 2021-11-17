import { XMLHttpRequest as xhrPolyfill } from 'xmlhttprequest';

export interface IRequestParameters {
  url: string;
  method?: 'GET' | 'POST';
  body?: any;
  forceHttp?: boolean;
  'bearer-token'?: string;
}

export default async function request (obj: IRequestParameters): Promise<any> {
  return await new Promise((resolve, reject) => {
    let { url } = obj;

    if (!url) {
      reject(new Error('URL is missing'));
    }

    if (url.substr(0, 7) === 'http://' && !obj.forceHttp) {
      console.warn(`Upgrading requested url ${url} to https protocol.`);
      url = url.replace('http://', 'https://');
    }

    // server
    const XHR = typeof XMLHttpRequest === 'undefined' ? xhrPolyfill : XMLHttpRequest;
    const request: XMLHttpRequest = new XHR();

    if (obj['bearer-token']) {
      request.setRequestHeader('Authorization', `Bearer ${obj['bearer-token']}`);
    }

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
