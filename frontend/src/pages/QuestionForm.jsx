import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Lightbulb } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { api, owns } from '../lib/api';
import { Button, Empty, Field, FormError, LoadState, PageTitle } from '../components/UI';
export default function QuestionForm() {
  const { id } = useParams(),
    request = useApi(id ? '/questions/' + id : null),
    { user } = useAuth();
  return id ? (
    <LoadState request={request}>
      {request.data &&
        (owns(user, request.data.item.author) ? (
          <Editor key={id} item={request.data.item} />
        ) : (
          <Empty title="Permission denied" description="Only the question owner can edit it." />
        ))}
    </LoadState>
  ) : (
    <Editor />
  );
}
function Editor({ item }) {
  const navigate = useNavigate(),
    notify = useToast(),
    subjects = useApi('/subjects'),
    [input, setInput] = useState({
      title: item?.title || '',
      body: item?.body || '',
      subject: item?.subject?._id || '',
      tags: item?.tags.join(', ') || '',
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(null);
  const set = (key) => (e) => setInput((v) => ({ ...v, [key]: e.target.value }));
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await api(item ? '/questions/' + item._id : '/questions', {
        method: item ? 'PATCH' : 'POST',
        body: {
          ...input,
          tags: [
            ...new Set(
              input.tags
                .split(',')
                .map((t) => t.trim().toLowerCase())
                .filter(Boolean),
            ),
          ],
        },
      });
      notify(result.message);
      navigate('/questions/' + result.item._id);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Link className="back-link" to={item ? '/questions/' + item._id : '/questions'}>
        <ArrowLeft size={16} />
        Back to questions
      </Link>
      <PageTitle
        title={item ? 'Edit your question' : 'Every answer starts here.'}
        description="Give your batchmates the context they need to help."
      />
      <div className="editor-layout">
        <form className="panel editor-form" onSubmit={submit}>
          <FormError error={error} />
          <Field
            label="Question title"
            required
            minLength={8}
            maxLength={180}
            value={input.title}
            onChange={set('title')}
            placeholder="What would you like to understand?"
          />
          <Field
            label="Details"
            required
            multiline
            rows={9}
            minLength={15}
            maxLength={10000}
            value={input.body}
            onChange={set('body')}
            placeholder="Explain the problem, what you’ve tried, and where you’re stuck."
          />
          <Field label="Subject" value={input.subject} onChange={set('subject')} required>
            <option value="">Choose a subject</option>
            {subjects.data?.items.map((s) => (
              <option key={s._id} value={s._id}>
                {s.code} · {s.name}
              </option>
            ))}
          </Field>
          <Field
            label="Topic tags"
            value={input.tags}
            onChange={set('tags')}
            maxLength={160}
            placeholder="e.g. recursion, algorithms, complexity"
            hint="Up to 5 comma-separated tags, 2–30 characters each."
          />
          <FormError error={subjects.error} />
          <div className="form-footer">
            <Link className="btn secondary" to="/questions">
              Cancel
            </Link>
            <Button busy={busy} disabled={!subjects.data?.items.length}>
              {item ? 'Save changes' : 'Post question'}
            </Button>
          </div>
        </form>
        <aside className="editor-help">
          <Lightbulb size={29} />
          <h2>Good questions invite good answers.</h2>
          <ol>
            <li>Search first. A useful answer might already be here.</li>
            <li>Write a specific title and explain what you’ve tried.</li>
            <li>Keep private information out of your question.</li>
            <li>Accept the answer that helps solve the problem.</li>
          </ol>
        </aside>
      </div>
    </>
  );
}
