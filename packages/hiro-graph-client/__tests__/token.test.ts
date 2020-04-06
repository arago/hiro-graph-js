import { Token } from '../src/token';

test('Create token', async () => {
  const token = new Token({ getToken: () => Promise.resolve('test') });

  const value = await token.get();

  expect(value).toBe('test');
});

test('Create token', async () => {
  let isInvalid = false;
  const token = new Token({
    getToken: () => Promise.resolve('test'),
    onInvalidate: () => {
      isInvalid = true;
    },
  });

  await token.invalidate();

  expect(isInvalid).toBe(true);
});
