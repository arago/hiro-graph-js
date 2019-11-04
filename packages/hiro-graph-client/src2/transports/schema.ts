import { POJO, RequestType } from '../types';

export const httpTypesPathMap: POJO = {
  '6.1': function createFetchOptions(
    graphApiPrefix: string,
    type: RequestType,
    headers: POJO,
    body?: POJO,
  ) {
    let url;
    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      mode: 'cors',
    };

    switch (type) {
      case 'getme':
        url = `${graphApiPrefix}/me`;

        return [url, options];
      case 'get':
        url = `${graphApiPrefix}/${encodeURIComponent(headers['ogit/_id'])}`;

        return [url, options];
      case 'create':
        url =
          `${graphApiPrefix}/new/` + encodeURIComponent(headers['ogit/_type']);

        return [url, makeBody(options, body)];
      case 'update':
        url = `${graphApiPrefix}/${encodeURIComponent(headers['ogit/_id'])}`;

        return [url, makeBody(options, body)];
      case 'replace':
        const t = headers.createIfNotExists ? headers['ogit/_type'] : undefined;
        const obj = Object.assign({ 'ogit/_type': t }, headers);

        url =
          `${graphApiPrefix}/${encodeURIComponent(headers['ogit/_id'])}` +
          qsKeys(obj, 'createIfNotExists', 'ogit/_type', 'waitForIndex');

        return [url, makeBody(options, body, 'PUT')];
      case 'delete':
        url = `${graphApiPrefix}/${encodeURIComponent(headers['ogit/_id'])}`;

        return [url, makeBody(options, body, 'DELETE')];
      case 'connect':
        url = `${graphApiPrefix}/connect/${encodeURIComponent(
          headers['ogit/_type'],
        )}`;

        return [url, makeBody(options, body)];
      case 'query':
        url = `${graphApiPrefix}/query/` + headers.type;

        return [url, makeBody(options, body)];
      case 'streamts':
        url =
          `${graphApiPrefix}/` +
          encodeURIComponent(headers['ogit/_id']) +
          '/values' +
          qsKeys(body, 'offset', 'limit');

        return [url, options];
      case 'writets':
        url =
          `${graphApiPrefix}/` +
          encodeURIComponent(headers['ogit/_id']) +
          '/values';

        return [url, makeBody(options, body)];
      case 'history':
        url =
          `${graphApiPrefix}/` +
          encodeURIComponent(headers['ogit/_id']) +
          '/history' +
          qsKeys(body, 'offset', 'limit', 'from', 'to', 'version', 'type');

        return [url, options];
      case 'meta':
        url =
          `${graphApiPrefix}/` +
          encodeURIComponent(headers['ogit/_id']) +
          '/meta';

        return [url, options];
      default:
        throw new Error(`[HTTP] Unknown API call: ${type}`);
    }
  },
  '7.0': function createFetchOptions(
    graphApiPrefix: string,
    type: RequestType,
    headers: POJO,
    body?: POJO,
  ) {
    let url;
    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      mode: 'cors',
    };

    switch (type) {
      case 'getme':
        url = `${graphApiPrefix}/me/account?profile=true`;

        return [url, options];
      case 'get':
        url = `${graphApiPrefix}/${encodeURIComponent(headers['ogit/_id'])}`;

        return [url, options];
      case 'create':
        url =
          `${graphApiPrefix}/new/` + encodeURIComponent(headers['ogit/_type']);

        return [url, makeBody(options, body)];
      case 'update':
        url = `${graphApiPrefix}/${encodeURIComponent(headers['ogit/_id'])}`;

        return [url, makeBody(options, body)];
      case 'replace':
        const t = headers.createIfNotExists ? headers['ogit/_type'] : undefined;
        const obj = Object.assign({ 'ogit/_type': t }, headers);

        url =
          `${graphApiPrefix}/${encodeURIComponent(headers['ogit/_id'])}` +
          qsKeys(obj, 'createIfNotExists', 'ogit/_type', 'waitForIndex');

        return [url, makeBody(options, body, 'PUT')];
      case 'delete':
        url = `${graphApiPrefix}/${encodeURIComponent(headers['ogit/_id'])}`;

        return [url, makeBody(options, body, 'DELETE')];
      case 'connect':
        url = `${graphApiPrefix}/connect/${encodeURIComponent(
          headers['ogit/_type'],
        )}`;

        return [url, makeBody(options, body)];
      case 'query':
        url = `${graphApiPrefix}/query/` + headers.type;

        return [url, makeBody(options, body)];
      case 'streamts':
        url =
          `${graphApiPrefix}/` +
          encodeURIComponent(headers['ogit/_id']) +
          '/values' +
          qsKeys(body, 'offset', 'limit');

        return [url, options];
      case 'writets':
        url =
          `${graphApiPrefix}/` +
          encodeURIComponent(headers['ogit/_id']) +
          '/values';

        return [url, makeBody(options, body)];
      case 'history':
        url =
          `${graphApiPrefix}/` +
          encodeURIComponent(headers['ogit/_id']) +
          '/history' +
          qsKeys(body, 'offset', 'limit', 'from', 'to', 'version', 'type');

        return [url, options];
      case 'meta':
        url =
          `${graphApiPrefix}/` +
          encodeURIComponent(headers['ogit/_id']) +
          '/meta';

        return [url, options];
      default:
        throw new Error(`[HTTP] Unknown API call: ${type}`);
    }
  },
};

function makeBody(options: POJO, body: POJO = {}, method: string = 'POST') {
  return {
    ...options,
    method,
    body: JSON.stringify(body),
  };
}

function qsKeys(obj: POJO = {}, ...keys: string[]) {
  const qs = keys
    .map((k) => {
      if (k in obj && obj[k] !== undefined) {
        return `${encodeURIComponent(k)}=${encodeURIComponent(obj[k])}`;
      }

      return false;
    })
    .filter(Boolean)
    .join('&');

  return qs.length ? '?' + qs : '';
}
