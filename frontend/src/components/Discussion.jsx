import { useState } from 'react';
import { CheckCircle2, Pencil, ThumbsUp, Trash2 } from 'lucide-react';
import { api, date, owns, staff } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { Avatar, Button, Confirm, Field, FormError } from './UI';
import ReportButton from './ReportButton';
export function BodyForm({
  label = 'Your comment',
  buttonLabel = 'Post comment',
  initial = '',
  onSubmit,
  onCancel,
}) {
  const [body, setBody] = useState(initial),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(null);
  return (
    <form
      className="body-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
          await onSubmit(body);
          setBody('');
        } catch (e) {
          setError(e);
        } finally {
          setBusy(false);
        }
      }}
    >
      <FormError error={error} />
      <Field
        label={label}
        multiline
        rows={4}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        required
        minLength={2}
        maxLength={5000}
        placeholder="Share a clear, helpful explanation…"
      />
      <div className="button-row">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button busy={busy}>{buttonLabel}</Button>
      </div>
    </form>
  );
}
export function DiscussionItem({
  item,
  type,
  onChange,
  accepted = false,
  canAccept = false,
  onAccept,
}) {
  const { user } = useAuth(),
    notify = useToast(),
    [editing, setEditing] = useState(false),
    [removing, setRemoving] = useState(false),
    [busy, setBusy] = useState(false);
  const path = '/' + (type === 'answer' ? 'answers' : 'comments') + '/' + item._id,
    owner = owns(user, item.author);
  async function action(fn) {
    setBusy(true);
    try {
      await fn();
      onChange();
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className={'discussion-item ' + (accepted ? 'accepted' : '')}>
      <div className="discussion-author">
        <Avatar name={item.author?.name} />
        <div>
          <strong>{item.author?.name || 'Batchmate'}</strong>
          <span>
            {date(item.createdAt)}
            {item.updatedAt !== item.createdAt ? ' · edited' : ''}
          </span>
        </div>
        {accepted && (
          <span className="accepted-label">
            <CheckCircle2 size={15} />
            Accepted answer
          </span>
        )}
      </div>
      {editing ? (
        <BodyForm
          initial={item.body}
          label="Edit your contribution"
          buttonLabel="Save changes"
          onCancel={() => setEditing(false)}
          onSubmit={async (body) => {
            await api(path, { method: 'PATCH', body: { body } });
            setEditing(false);
            notify('Changes saved.');
            onChange();
          }}
        />
      ) : (
        <p className="prose">{item.body}</p>
      )}
      <div className="discussion-actions">
        {type === 'answer' && (
          <button
            className={'vote-btn ' + (item.useful ? 'voted' : '')}
            disabled={owner || busy}
            aria-pressed={Boolean(item.useful)}
            title={owner ? 'You cannot vote on your own answer' : 'Mark this answer useful'}
            onClick={() =>
              action(() => api(path + '/vote', { method: 'PUT', body: { useful: !item.useful } }))
            }
          >
            <ThumbsUp size={15} />
            Useful · {item.usefulCount}
          </button>
        )}
        {canAccept && (
          <button
            className="text-btn"
            disabled={busy}
            onClick={() => action(() => onAccept(accepted ? null : item._id))}
          >
            <CheckCircle2 size={15} />
            {accepted ? 'Unaccept' : 'Accept answer'}
          </button>
        )}
        <div className="spacer" />
        {owner && (
          <button className="text-btn" onClick={() => setEditing(!editing)}>
            <Pencil size={14} />
            Edit
          </button>
        )}
        {(owner || staff(user)) && (
          <button className="text-btn danger-text" onClick={() => setRemoving(true)}>
            <Trash2 size={14} />
            Delete
          </button>
        )}
        <ReportButton targetType={type} targetId={item._id} />
      </div>
      {removing && (
        <Confirm
          title={'Delete this ' + type + '?'}
          onClose={() => setRemoving(false)}
          onConfirm={async () => {
            await api(path, { method: 'DELETE' });
            notify('Content removed.');
            onChange();
          }}
        />
      )}
    </article>
  );
}
