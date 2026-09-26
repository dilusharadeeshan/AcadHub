import { afterEach, it, expect, vi } from 'vitest';
afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});
it('fetches CSRF once and sends cookies with every mutation', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ csrfToken: 'csrf-test' }) })
    .mockResolvedValue({ ok: true, json: async () => ({ message: 'Saved' }) });
  vi.stubGlobal('fetch', fetcher);
  const { api } = await import('./api');
  await api('/questions', { method: 'POST', body: { title: 'A question' } });
  expect(fetcher).toHaveBeenNthCalledWith(1, '/api/auth/csrf', { credentials: 'include' });
  expect(fetcher.mock.calls[1][1]).toMatchObject({
    credentials: 'include',
    headers: { 'X-CSRF-Token': 'csrf-test', 'Content-Type': 'application/json' },
  });
  await api('/questions', { method: 'POST', body: { title: 'Another question' } });
  expect(fetcher).toHaveBeenCalledTimes(3);
});
it('propagates server validation fields without swallowing errors', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Check your input', errors: { title: 'Too short' } }),
    }),
  );
  const { api } = await import('./api');
  await expect(api('/materials')).rejects.toMatchObject({
    status: 400,
    fields: { title: 'Too short' },
  });
});
it('turns a network failure into useful feedback', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));
  const { api } = await import('./api');
  await expect(api('/materials')).rejects.toThrow('Unable to connect');
});
