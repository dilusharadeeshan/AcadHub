const base = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
let csrfToken;
let csrfRequest;
async function getCsrf() {
  if (csrfToken) return csrfToken;
  if (!csrfRequest)
    csrfRequest = fetch(base + '/auth/csrf', { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) throw new Error('Could not establish a secure connection. Please retry.');
        csrfToken = (await res.json()).csrfToken;
        return csrfToken;
      })
      .finally(() => {
        csrfRequest = undefined;
      });
  return csrfRequest;
}
export async function api(path, { method = 'GET', body, signal } = {}) {
  const headers = {};
  if (!['GET', 'HEAD'].includes(method)) headers['X-CSRF-Token'] = await getCsrf();
  if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
  let response;
  try {
    response = await fetch(base + path, {
      method,
      headers,
      credentials: 'include',
      signal,
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Unable to connect. Check your connection and try again.', { cause: error });
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('The server returned an unexpected response. Please try again.');
  }
  if (!response.ok) {
    if (response.status === 401 && !['/auth/login', '/auth/register'].includes(path))
      window.dispatchEvent(new Event('acadhub:session-ended'));
    if (response.status === 403) csrfToken = undefined;
    const error = new Error(data.message || 'Something went wrong.');
    error.status = response.status;
    error.fields = data.errors;
    throw error;
  }
  return data;
}
export const fileUrl = (id, view = false) =>
  base + '/materials/' + id + '/file' + (view ? '?view=true' : '');
export const queryString = (values) => {
  const p = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== '' && value !== undefined && value !== null) p.set(key, String(value));
  });
  return p.toString();
};
export const date = (value) =>
  value
    ? new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(
        new Date(value),
      )
    : '';
export const bytes = (value) =>
  value === undefined || value === null
    ? 'Link'
    : value < 1024
      ? value + ' B'
      : value < 1024 * 1024
        ? (value / 1024).toFixed(1) + ' KB'
        : (value / 1024 / 1024).toFixed(1) + ' MB';
export const owns = (user, owner) => user?.id === String(owner?._id || owner);
export const staff = (user) => ['admin', 'moderator'].includes(user?.role);
