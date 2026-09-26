import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, GraduationCap, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { Button, Field, FormError } from '../components/UI';

export function AuthPage({ register = false }) {
  const { user, login } = useAuth(),
    notify = useToast(),
    navigate = useNavigate(),
    location = useLocation();
  const [input, setInput] = useState({
      name: '',
      email: '',
      password: '',
      department: '',
      batch: '',
      semester: 1,
      remember: false,
      agreeToPolicy: false,
    }),
    [visible, setVisible] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(null);
  if (user) return <Navigate to={user.status === 'pending' ? '/pending' : '/dashboard'} replace />;
  const set = (key) => (e) =>
    setInput((v) => ({
      ...v,
      [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    }));
  async function submit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (register) {
        const body = Object.fromEntries(
          Object.entries(input).filter(([key]) => key !== 'remember'),
        );
        const result = await api('/auth/register', { method: 'POST', body });
        notify(result.message);
        navigate('/login', { state: { registered: true } });
      } else {
        const account = await login({
          email: input.email,
          password: input.password,
          remember: input.remember,
        });
        const from = location.state?.from;
        navigate(
          account.status === 'pending'
            ? '/pending'
            : from?.startsWith('/') && !from.startsWith('//')
              ? from
              : '/dashboard',
          { replace: true },
        );
      }
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-layout">
      <main className="auth-main">
        <div className={'auth-form ' + (register ? 'auth-register' : '')}>
          <header className="auth-heading">
            <Link className="auth-logo" to="/login" aria-label="AcadHub sign in">
              <GraduationCap size={27} />
            </Link>
            <h1 className="brand-word">
              Acad<span>Hub</span>
            </h1>
            <p>Centralized Academic Collaboration Workspace</p>
            {register && <h2>Create your account</h2>}
          </header>
          {location.state?.registered && (
            <div className="notice success">
              Account created. Sign in to view your approval status.
            </div>
          )}
          <form onSubmit={submit}>
            <FormError error={error} />
            {register && (
              <Field
                label="Full name"
                name="name"
                autoComplete="name"
                minLength={2}
                maxLength={80}
                value={input.name}
                onChange={set('name')}
                required
                error={error?.fields?.name}
              />
            )}
            <Field
              label="Email address"
              name="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              placeholder="name@university.ac.lk"
              value={input.email}
              onChange={set('email')}
              required
              error={error?.fields?.email}
            />
            <div className="password-field">
              {!register && (
                <details className="auth-recovery">
                  <summary>Lost password?</summary>
                  <p>
                    Contact your batch administrator to verify your identity and securely reset your
                    password.
                  </p>
                </details>
              )}
              <Field
                label="Password"
                name="password"
                type={visible ? 'text' : 'password'}
                autoComplete={register ? 'new-password' : 'current-password'}
                minLength={register ? 10 : 1}
                maxLength={72}
                value={input.password}
                onChange={set('password')}
                required
                hint={register ? 'At least 10 characters; use a unique passphrase.' : undefined}
                error={error?.fields?.password}
              />
              <button
                type="button"
                className="password-toggle icon-btn"
                aria-label={visible ? 'Hide password' : 'Show password'}
                onClick={() => setVisible(!visible)}
              >
                {visible ? 'Hide' : 'Show'}
              </button>
            </div>
            {register ? (
              <>
                <Field
                  label="Department"
                  name="department"
                  minLength={2}
                  maxLength={100}
                  placeholder="e.g. Computer Science"
                  value={input.department}
                  onChange={set('department')}
                  required
                />
                <div className="form-grid">
                  <Field
                    label="Batch"
                    name="batch"
                    minLength={2}
                    maxLength={40}
                    placeholder="e.g. 2024/2025"
                    value={input.batch}
                    onChange={set('batch')}
                    required
                  />
                  <Field label="Semester" value={input.semester} onChange={set('semester')}>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option value={i + 1} key={i}>
                        {i + 1}
                      </option>
                    ))}
                  </Field>
                </div>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={input.agreeToPolicy}
                    onChange={set('agreeToPolicy')}
                    required
                  />
                  <span>
                    I agree to the{' '}
                    <Link to="/guidelines" target="_blank">
                      community guidelines
                    </Link>{' '}
                    and understand my account requires administrator approval.
                  </span>
                </label>
              </>
            ) : (
              <div className="form-options">
                <label className="checkbox-label">
                  <input type="checkbox" checked={input.remember} onChange={set('remember')} />
                  Keep me signed in for 7 days
                </label>
              </div>
            )}
            <Button className="full-width" busy={busy}>
              {register ? 'Create your account' : 'Sign in'}
              <ArrowRight size={17} />
            </Button>
          </form>
          <p className="auth-switch">
            {register ? 'Already part of the community?' : 'Don’t have an account yet?'}{' '}
            <Link to={register ? '/login' : '/register'}>
              {register ? 'Sign in' : 'Create an account'}
            </Link>
          </p>
        </div>
      </main>
      <footer className="auth-copyright">
        © {new Date().getFullYear()} AcadHub · Academic Management System
      </footer>
    </div>
  );
}
export function PendingPage() {
  const { user, refresh, logout } = useAuth(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(null),
    notify = useToast();
  if (user?.status === 'active') return <Navigate to="/dashboard" replace />;
  return (
    <div className="center-page">
      <div className="panel pending-panel">
        <span className="empty-icon">
          <ShieldCheck size={36} />
        </span>
        <h1>You’re on the list, {user?.name.split(' ')[0]}.</h1>
        <p>
          Your account is waiting for administrator approval. This helps keep your academic
          community trusted.
        </p>
        <p className="muted">
          Your administrator can find your request using <strong>{user?.email}</strong>.
        </p>
        <FormError error={error} />
        <div className="button-row">
          <Button
            busy={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const account = await refresh();
                if (account.status === 'pending')
                  notify('Your request is still waiting for review.');
              } catch (e) {
                setError(e);
              } finally {
                setBusy(false);
              }
            }}
          >
            Check approval status
          </Button>
          <Link className="btn secondary" to="/profile">
            Edit profile
          </Link>
          <Button
            variant="ghost"
            onClick={async () => {
              try {
                await logout();
              } catch (e) {
                setError(e);
              }
            }}
          >
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
