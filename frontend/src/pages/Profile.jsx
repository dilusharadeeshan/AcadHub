import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, UserRound } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { Avatar, Badge, Button, Field, FormError, PageTitle } from '../components/UI';
export default function Profile() {
  const { user, setUser } = useAuth(),
    notify = useToast(),
    navigate = useNavigate(),
    [profile, setProfile] = useState({
      name: user.name,
      department: user.department || '',
      batch: user.batch || '',
      semester: user.semester || 1,
      bio: user.bio || '',
    }),
    [password, setPassword] = useState({ currentPassword: '', password: '' }),
    [error, setError] = useState(null),
    [passwordError, setPasswordError] = useState(null),
    [busy, setBusy] = useState(false),
    [changing, setChanging] = useState(false);
  const set = (key) => (e) => setProfile((p) => ({ ...p, [key]: e.target.value }));
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const data = await api('/auth/profile', { method: 'PATCH', body: profile });
      setUser(data.user);
      notify(data.message);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  async function change(e) {
    e.preventDefault();
    setChanging(true);
    setPasswordError(null);
    try {
      const data = await api('/auth/password', { method: 'PUT', body: password });
      setUser(null);
      notify(data.message);
      navigate('/login');
    } catch (e) {
      setPasswordError(e);
    } finally {
      setChanging(false);
    }
  }
  return (
    <div className={user.status === 'pending' ? 'standalone' : ''}>
      {user.status === 'pending' && (
        <Link className="back-link" to="/pending">
          ← Back to approval status
        </Link>
      )}
      <PageTitle
        title="Make yourself at home."
        description="Keep your academic profile up to date."
      />
      <div className="profile-layout">
        <aside className="panel profile-summary">
          <Avatar name={user.name} />
          <h2>{user.name}</h2>
          <p className="muted">{user.email}</p>
          <div className="tags">
            <Badge>{user.role}</Badge>
            <Badge tone={user.status === 'active' ? 'approved' : 'pending'}>{user.status}</Badge>
          </div>
          <p className="small-text muted">
            Your email is private to you and authorized administrators. Your name, department, and
            batch appear alongside your contributions.
          </p>
        </aside>
        <div>
          <form className="panel" onSubmit={save}>
            <h2>
              <UserRound size={21} />
              Your academic profile
            </h2>
            <FormError error={error} />
            <Field
              label="Full name"
              autoComplete="name"
              value={profile.name}
              onChange={set('name')}
              minLength={2}
              maxLength={80}
              required
            />
            <Field
              label="Email address"
              type="email"
              value={user.email}
              readOnly
              hint="Contact an administrator if your email address needs correcting."
            />
            <div className="form-grid">
              <Field
                label="Department"
                value={profile.department}
                onChange={set('department')}
                minLength={2}
                maxLength={100}
                required
              />
              <Field
                label="Batch"
                value={profile.batch}
                onChange={set('batch')}
                minLength={2}
                maxLength={40}
                required
              />
              <Field label="Semester" value={profile.semester} onChange={set('semester')}>
                {Array.from({ length: 12 }, (_, i) => (
                  <option value={i + 1} key={i}>
                    Semester {i + 1}
                  </option>
                ))}
              </Field>
            </div>
            <Field
              label="About you"
              multiline
              rows={3}
              value={profile.bio}
              onChange={set('bio')}
              maxLength={500}
              hint="A little about what you’re studying or interested in."
            />
            <div className="form-footer">
              <Button busy={busy}>Save profile</Button>
            </div>
          </form>
          <form className="panel password-panel" onSubmit={change}>
            <h2>
              <KeyRound size={21} />
              Change password
            </h2>
            <p className="muted">Changing your password signs you out on all devices.</p>
            <FormError error={passwordError} />
            <Field
              label="Current password"
              type="password"
              autoComplete="current-password"
              value={password.currentPassword}
              onChange={(e) => setPassword((p) => ({ ...p, currentPassword: e.target.value }))}
              required
            />
            <Field
              label="New password"
              type="password"
              autoComplete="new-password"
              minLength={10}
              maxLength={72}
              value={password.password}
              onChange={(e) => setPassword((p) => ({ ...p, password: e.target.value }))}
              hint="At least 10 characters. Choose a unique passphrase."
              required
            />
            <Button variant="secondary" busy={changing}>
              Update password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
