import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthContext, ToastContext } from '../context/contexts';
import { AuthPage, PendingPage } from './AuthPages';
import { api } from '../lib/api';
vi.mock('../lib/api', async (importOriginal) => ({ ...(await importOriginal()), api: vi.fn() }));
function renderAuth(props = {}, context = {}) {
  const value = { user: null, login: vi.fn(), refresh: vi.fn(), logout: vi.fn(), ...context };
  render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthContext.Provider value={value}>
        <ToastContext.Provider value={vi.fn()}>
          <Routes>
            <Route path="/login" element={<AuthPage {...props} />} />
            <Route path="/dashboard" element={<h1>My dashboard</h1>} />
            <Route path="/pending" element={<PendingPage />} />
          </Routes>
        </ToastContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>,
  );
  return value;
}
describe('account forms', () => {
  it('uses accessible labels and toggles password visibility', async () => {
    const user = userEvent.setup();
    renderAuth();
    expect(screen.getByLabelText(/Email address/)).toHaveAttribute('type', 'email');
    const password = screen.getByLabelText('Password *');
    expect(password).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(password).toHaveAttribute('type', 'text');
  });
  it('submits credentials with the chosen persistent-session option', async () => {
    const user = userEvent.setup(),
      login = vi.fn().mockResolvedValue({ status: 'active' });
    renderAuth({}, { login });
    await user.type(screen.getByLabelText(/Email address/), 'student@acadhub.test');
    await user.type(screen.getByLabelText('Password *'), 'test-passphrase');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Sign in', exact: true }));
    await waitFor(() =>
      expect(login).toHaveBeenCalledWith({
        email: 'student@acadhub.test',
        password: 'test-passphrase',
        remember: true,
      }),
    );
    expect(await screen.findByRole('heading', { name: 'My dashboard' })).toBeInTheDocument();
  });
  it('shows a server login error in an alert instead of navigating', async () => {
    const user = userEvent.setup();
    renderAuth({}, { login: vi.fn().mockRejectedValue(new Error('Invalid email or password.')) });
    await user.type(screen.getByLabelText(/Email address/), 'student@acadhub.test');
    await user.type(screen.getByLabelText('Password *'), 'incorrect');
    await user.click(screen.getByRole('button', { name: 'Sign in', exact: true }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password.');
  });
  it('requires agreement and academic profile fields for registration', () => {
    renderAuth({ register: true });
    expect(screen.getByLabelText(/Full name/)).toBeRequired();
    expect(screen.getByLabelText(/Department/)).toBeRequired();
    expect(screen.getByLabelText(/Batch/)).toBeRequired();
    expect(screen.getByRole('checkbox')).toBeRequired();
    expect(screen.getByLabelText('Password *')).toHaveAttribute('minlength', '10');
  });
  it('sends only allowed registration fields and shows validation errors', async () => {
    const user = userEvent.setup();
    api.mockRejectedValueOnce(
      Object.assign(new Error('Please check the highlighted fields.'), {
        fields: { email: 'Email already registered.' },
      }),
    );
    renderAuth({ register: true });
    await user.type(screen.getByLabelText(/Full name/), 'Test Student');
    await user.type(screen.getByLabelText(/Email address/), 'test@acadhub.test');
    await user.type(screen.getByLabelText('Password *'), 'safe-test-passphrase');
    await user.type(screen.getByLabelText(/Department/), 'Computer Science');
    await user.type(screen.getByLabelText(/Batch/), '2024/2025');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Create your account' }));
    await waitFor(() =>
      expect(api).toHaveBeenCalledWith(
        '/auth/register',
        expect.objectContaining({
          method: 'POST',
          body: expect.objectContaining({ agreeToPolicy: true }),
        }),
      ),
    );
    expect(api.mock.calls.at(-1)[1].body).not.toHaveProperty('remember');
    expect(await screen.findByRole('alert')).toHaveTextContent('Email already registered.');
  });
});
