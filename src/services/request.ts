export interface IRequestParameters {
  url: string;
  method?: 'GET' | 'POST';
  body?: any;
  forceHttp?: boolean;
  'bearer-token'?: string;
}

export default async function request(parameters: IRequestParameters): Promise<any> {
  let { url } = parameters;

  if (!url) {
    throw new Error('URL is missing');
  }

  if (url.startsWith('http://') && !parameters.forceHttp) {
    console.warn(`Upgrading requested url ${url} to https protocol.`);
    url = url.replace('http://', 'https://');
  }

  const headers: Record<string, string> = {};

  if (parameters['bearer-token']) {
    headers['Authorization'] = `Bearer ${parameters['bearer-token']}`;
  }

  let requestBody: string | undefined;

  if (parameters.body) {
    requestBody = JSON.stringify(parameters.body);
    headers['Content-Type'] = 'application/json';
  }

  let response: Response;

  try {
    response = await fetch(url, {
      method: parameters.method ?? 'GET',
      headers,
      body: requestBody
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown network error';

    console.error(`Request failed with error ${errorMessage}`);
    throw new Error(errorMessage);
  }

  const responseText = await response.text();

  if (!response.ok) {
    console.log(responseText);
    const failureMessage = `Error fetching url:${url}; status code:${response.status}`;
    throw new Error(failureMessage);
  }

  return responseText;
}
