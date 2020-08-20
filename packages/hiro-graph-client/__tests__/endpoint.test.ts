import { Endpoint } from '../src/endpoint';

test('Create endpoint', () => {
  const tests: Array<[Endpoint<any>, string]> = [
    [new Endpoint('http://example.com'), 'http://example.com'],
    [new Endpoint('https://example.com'), 'https://example.com'],
    [new Endpoint('https://example.com/'), 'https://example.com'],
    [new Endpoint('http://example.com', true), 'ws://example.com'],
    [new Endpoint('https://example.com', true), 'wss://example.com'],
    [new Endpoint('https://example.com/', true), 'wss://example.com'],
  ];

  tests.forEach(([res, expected]) => {
    expect(res.value).toEqual(expected);
  });
});

test('Get API', () => {
  const tests: Array<[string, string]> = [
    [
      new Endpoint('https://example.com').api('app'),
      'https://example.com/api/app/7.0',
    ],
    [
      new Endpoint('https://example.com').api('auth'),
      'https://example.com/api/auth/6.1',
    ],
    [
      new Endpoint('https://example.com').api('graph'),
      'https://example.com/api/graph/7.1',
    ],
    [
      new Endpoint('https://example.com').api('iam'),
      'https://example.com/api/iam/6.1',
    ],
    [
      new Endpoint('https://example.com').api('ki'),
      'https://example.com/api/ki/6',
    ],
    [
      new Endpoint('https://example.com').api('variables'),
      'https://example.com/api/variables/6',
    ],
    [
      new Endpoint('https://example.com', true).api('events'),
      'wss://example.com/api/events-ws/6.1',
    ],
    [
      new Endpoint('https://example.com', true).api('graph'),
      'wss://example.com/api/graph-ws/6.1',
    ],
  ];

  tests.forEach(([res, expected]) => {
    expect(res).toEqual(expected);
  });
});

test('Get API with path', () => {
  const tests: Array<[string, string]> = [
    [
      new Endpoint('https://example.com').api('graph', '/test'),
      'https://example.com/api/graph/7.1/test',
    ],
    [
      new Endpoint('https://example.com').api('graph', 'test'),
      'https://example.com/api/graph/7.1/test',
    ],
  ];

  tests.forEach(([res, expected]) => {
    expect(res).toEqual(expected);
  });
});

test('Re-use API', () => {
  const endpoint = new Endpoint('https://example.com').use('graph');

  const tests: Array<[string, string]> = [
    [endpoint.path('/test'), 'https://example.com/api/graph/7.1/test'],
    [endpoint.path('test'), 'https://example.com/api/graph/7.1/test'],
  ];

  tests.forEach(([res, expected]) => {
    expect(res).toEqual(expected);
  });
});

test('Get path without API', () => {
  const endpoint = new Endpoint('https://example.com');

  const tests: Array<[string, string]> = [
    [endpoint.path('/test'), 'https://example.com/test'],
    [endpoint.path('test'), 'https://example.com/test'],
  ];

  tests.forEach(([res, expected]) => {
    expect(res).toEqual(expected);
  });
});

test('Get API with path array', () => {
  const endpoint = new Endpoint('https://example.com').use('graph');

  const tests: Array<[string, string]> = [
    [endpoint.path(['a', 'b', 'c']), 'https://example.com/api/graph/7.1/a/b/c'],
  ];

  tests.forEach(([res, expected]) => {
    expect(res).toEqual(expected);
  });
});

test('Get API with query', () => {
  const tests: Array<[string, string]> = [
    [
      new Endpoint('https://example.com').api('graph', '/test', {
        a: 'hello',
      }),
      'https://example.com/api/graph/7.1/test?a=hello',
    ],
    [
      new Endpoint('https://example.com').api('graph', 'test', { a: 'hello' }),
      'https://example.com/api/graph/7.1/test?a=hello',
    ],
    [
      new Endpoint('https://example.com').api('graph', 'test', {
        a: 'hello',
        b: 'world',
      }),
      'https://example.com/api/graph/7.1/test?a=hello&b=world',
    ],
    [
      new Endpoint('https://example.com').api('graph', 'test', {}),
      'https://example.com/api/graph/7.1/test',
    ],
  ];

  tests.forEach(([res, expected]) => {
    expect(res).toEqual(expected);
  });
});

test('Use custom APIs', () => {
  const endpoint = new Endpoint('https://example.com', false, {
    provider: '/services/provider/1.0/codes',
  });

  const tests: Array<[string, string]> = [
    [
      endpoint.api('provider', '/test', {
        a: 'hello',
      }),
      'https://example.com/services/provider/1.0/codes/test?a=hello',
    ],
  ];

  tests.forEach(([res, expected]) => {
    expect(res).toEqual(expected);
  });
});
