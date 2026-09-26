import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, GraduationCap, Pencil, Plus, Trash2 } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { api, staff } from '../lib/api';
import {
  Badge,
  Button,
  Confirm,
  Empty,
  Field,
  FormError,
  LoadState,
  Modal,
  PageTitle,
} from '../components/UI';
export default function Subjects() {
  const request = useApi('/subjects'),
    { user } = useAuth(),
    notify = useToast(),
    [editing, setEditing] = useState(null),
    [removing, setRemoving] = useState(null),
    [search, setSearch] = useState('');
  const items =
    request.data?.items.filter((s) =>
      (s.name + ' ' + s.code + ' ' + s.department).toLowerCase().includes(search.toLowerCase()),
    ) || [];
  return (
    <>
      <PageTitle
        eyebrow="FIND YOUR FOCUS"
        title="A space for every subject."
        description="Explore the subjects that connect your resources and conversations."
        action={
          staff(user) && (
            <Button onClick={() => setEditing({})}>
              <Plus size={17} />
              Add subject
            </Button>
          )
        }
      />
      <div className="subject-search">
        <Field
          label="Find a subject"
          type="search"
          value={search}
          maxLength={100}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search subjects, codes, or departments…"
        />
      </div>
      <LoadState request={request}>
        <div className="subject-grid">
          {items.map((item) => (
            <article className="panel subject-card" key={item._id}>
              <span className="stat-icon lavender">
                <GraduationCap size={25} />
              </span>
              <Badge>Semester {item.semester}</Badge>
              <h2>{item.name}</h2>
              <span className="subject-code">
                {item.code} · {item.department}
              </span>
              <p className="muted">
                {item.description || 'Resources and conversations for your next step.'}
              </p>
              <div className="subject-card-links">
                <Link to={'/resources?subject=' + item._id}>
                  Resources <ArrowRight size={15} />
                </Link>
                <Link to={'/questions?subject=' + item._id}>
                  Questions <ArrowRight size={15} />
                </Link>
              </div>
              {staff(user) && (
                <div className="resource-actions">
                  <button className="text-btn" onClick={() => setEditing(item)}>
                    <Pencil size={14} />
                    Edit
                  </button>
                  {user.role === 'admin' && (
                    <button className="text-btn danger-text" onClick={() => setRemoving(item)}>
                      <Trash2 size={14} />
                      Delete
                    </button>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
        {!items.length && (
          <div className="panel">
            <Empty
              title="No subjects found"
              description={
                staff(user)
                  ? 'Add your department’s first subject to get started.'
                  : 'Your moderators will organize the subjects here.'
              }
            />
          </div>
        )}
      </LoadState>
      {editing && (
        <SubjectEditor
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            request.reload();
          }}
        />
      )}
      {removing && (
        <Confirm
          title={'Delete ' + removing.code + '?'}
          description="Subjects can only be deleted when they have no resources or questions."
          onClose={() => setRemoving(null)}
          onConfirm={async () => {
            await api('/subjects/' + removing._id, { method: 'DELETE' });
            notify('Subject removed.');
            request.reload();
          }}
        />
      )}
    </>
  );
}
function SubjectEditor({ item, onClose, onSaved }) {
  const [input, setInput] = useState({
      name: item.name || '',
      code: item.code || '',
      department: item.department || '',
      semester: item.semester || 1,
      description: item.description || '',
    }),
    [error, setError] = useState(null),
    [busy, setBusy] = useState(false),
    notify = useToast();
  const set = (key) => (e) => setInput((v) => ({ ...v, [key]: e.target.value }));
  return (
    <Modal title={item._id ? 'Edit subject' : 'Add subject'} onClose={() => !busy && onClose()}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            const data = await api(item._id ? '/subjects/' + item._id : '/subjects', {
              method: item._id ? 'PATCH' : 'POST',
              body: input,
            });
            notify(data.message);
            onSaved();
          } catch (e) {
            setError(e);
          } finally {
            setBusy(false);
          }
        }}
      >
        <FormError error={error} />
        <Field
          label="Subject name"
          value={input.name}
          onChange={set('name')}
          required
          minLength={2}
          maxLength={100}
        />
        <div className="form-grid">
          <Field
            label="Subject code"
            value={input.code}
            onChange={set('code')}
            required
            minLength={2}
            maxLength={20}
          />
          <Field label="Semester" value={input.semester} onChange={set('semester')}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </Field>
        </div>
        <Field
          label="Department"
          value={input.department}
          onChange={set('department')}
          required
          minLength={2}
          maxLength={100}
        />
        <Field
          label="Description"
          multiline
          rows={3}
          value={input.description}
          onChange={set('description')}
          maxLength={500}
        />
        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button busy={busy}>Save subject</Button>
        </div>
      </form>
    </Modal>
  );
}
