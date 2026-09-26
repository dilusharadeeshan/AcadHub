import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileUp, ShieldCheck } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { api, bytes, owns } from '../lib/api';
import { Button, Empty, Field, FormError, LoadState, PageTitle } from '../components/UI';
export default function ResourceForm() {
  const { id } = useParams(),
    request = useApi(id ? '/materials/' + id : null),
    subjects = useApi('/subjects'),
    meta = useApi('/meta'),
    { user } = useAuth();
  if (id)
    return (
      <LoadState request={request}>
        {request.data &&
          (owns(user, request.data.item.uploader) ? (
            <Editor key={id} item={request.data.item} subjects={subjects} meta={meta} />
          ) : (
            <Empty
              title="Permission denied"
              description="Only the uploader can edit this resource."
            />
          ))}
      </LoadState>
    );
  return <Editor subjects={subjects} meta={meta} />;
}
function Editor({ item, subjects, meta }) {
  const { user } = useAuth(),
    navigate = useNavigate(),
    notify = useToast(),
    [input, setInput] = useState(
      item
        ? {
            title: item.title,
            description: item.description,
            subject: item.subject?._id || '',
            category: item.category,
            semester: item.semester,
            academicYear: item.academicYear,
            link: item.link || '',
          }
        : {
            title: '',
            description: '',
            subject: '',
            category: 'Lecture notes',
            semester: user.semester || 1,
            academicYear: String(new Date().getFullYear()),
            link: '',
          },
    );
  const [file, setFile] = useState(null),
    [error, setError] = useState(null),
    [busy, setBusy] = useState(false),
    [agreed, setAgreed] = useState(false);
  const set = (key) => (e) =>
    setInput((v) => ({
      ...v,
      [key]: e.target.value,
      ...(key === 'category' && e.target.value !== 'Academic links' ? { link: '' } : {}),
    }));
  async function submit(e) {
    e.preventDefault();
    setError(null);
    if (!agreed) {
      setError(new Error('Confirm you have permission to share this resource.'));
      return;
    }
    if (!item && input.category !== 'Academic links' && !file) {
      setError(new Error('Choose a file to upload.'));
      return;
    }
    if (file && file.size > (meta.data?.maxFileBytes || 10485760)) {
      setError(new Error('The file is too large.'));
      return;
    }
    setBusy(true);
    try {
      let body = input;
      if (!item) {
        body = new FormData();
        Object.entries(input).forEach(([k, v]) => body.append(k, v));
        if (file && input.category !== 'Academic links') body.append('file', file);
      }
      const data = await api(item ? '/materials/' + item._id : '/materials', {
        method: item ? 'PATCH' : 'POST',
        body,
      });
      notify(data.message);
      navigate('/resources/' + data.item._id);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Link className="back-link" to={item ? '/resources/' + item._id : '/resources'}>
        <ArrowLeft size={16} />
        Back to resources
      </Link>
      <PageTitle
        eyebrow="GOOD KNOWLEDGE DESERVES COMPANY"
        title={item ? 'Edit your resource' : 'Share a little. Help a lot.'}
        description="Add something useful to your batch’s collective knowledge."
      />
      <div className="editor-layout">
        <form className="panel editor-form" onSubmit={submit}>
          <FormError error={error} />
          <Field
            label="Resource title"
            placeholder="e.g. Data Structures — Trees & Graphs Notes"
            value={input.title}
            onChange={set('title')}
            required
            minLength={4}
            maxLength={160}
            error={error?.fields?.title}
          />
          <Field
            label="Description"
            multiline
            rows={5}
            placeholder="What does this cover? Tell your batchmates why it’s useful."
            value={input.description}
            onChange={set('description')}
            required
            minLength={10}
            maxLength={5000}
            error={error?.fields?.description}
          />
          <div className="form-grid">
            <Field label="Subject" value={input.subject} onChange={set('subject')} required>
              <option value="">Choose a subject</option>
              {subjects.data?.items.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.code} · {s.name}
                </option>
              ))}
            </Field>
            <Field label="Category" value={input.category} onChange={set('category')} required>
              {(meta.data?.categories || [input.category]).map((c) => (
                <option
                  key={c}
                  disabled={!!item && (c === 'Academic links') !== Boolean(item.link)}
                >
                  {c}
                </option>
              ))}
            </Field>
            <Field label="Semester" value={input.semester} onChange={set('semester')}>
              {Array.from({ length: 12 }, (_, i) => (
                <option value={i + 1} key={i}>
                  Semester {i + 1}
                </option>
              ))}
            </Field>
            <Field
              label="Academic year"
              value={input.academicYear}
              onChange={set('academicYear')}
              required
              pattern="20[0-9]{2}([/-]20[0-9]{2})?"
              maxLength={9}
              hint="For example, 2026 or 2026/2027"
            />
          </div>
          {subjects.error && <FormError error={subjects.error} />}{' '}
          {subjects.data?.items.length === 0 && (
            <div className="notice">A moderator needs to add subjects before you can upload.</div>
          )}
          {input.category === 'Academic links' ? (
            <Field
              label="Academic link"
              type="url"
              value={input.link}
              onChange={set('link')}
              placeholder="https://…"
              required
              maxLength={2000}
              hint="Use an HTTPS link to a public academic source."
            />
          ) : item ? (
            <div className="notice">
              <FileUp size={20} />
              Current file: {item.file?.name}. Create a new resource to share a replacement file.
            </div>
          ) : (
            <label className="upload-zone">
              <FileUp size={30} />
              <strong>{file ? file.name : 'Choose a file to share'}</strong>
              <span>
                PDF, PNG, JPEG, or UTF-8 text · up to {bytes(meta.data?.maxFileBytes || 10485760)}
              </span>
              <input
                aria-label="Resource file"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.txt"
                required
                onChange={(e) => setFile(e.target.files[0] || null)}
              />
            </label>
          )}
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              required
            />
            <span>
              I have permission to share this material and it follows our{' '}
              <Link to="/guidelines" target="_blank">
                community guidelines
              </Link>
              .
            </span>
          </label>
          <div className="form-footer">
            <Link className="btn secondary" to={item ? '/resources/' + item._id : '/resources'}>
              Cancel
            </Link>
            <Button busy={busy} disabled={!subjects.data?.items.length}>
              {item ? 'Save & submit for review' : 'Submit for review'}
            </Button>
          </div>
        </form>
        <aside className="editor-help">
          <ShieldCheck size={28} />
          <h2>A library we can trust.</h2>
          <p>Every upload is reviewed before it becomes available to your batch.</p>
          <ol>
            <li>
              <strong>Make it easy to find.</strong>
              <br />
              Use a clear title and the right subject.
            </li>
            <li>
              <strong>Give credit.</strong>
              <br />
              Name your sources in the description.
            </li>
            <li>
              <strong>Keep it academic.</strong>
              <br />
              Avoid personal information and copyrighted material you cannot share.
            </li>
          </ol>
          <p className="small-text">
            Edits return a resource to the review queue. You can track the status in My
            contributions.
          </p>
        </aside>
      </div>
    </>
  );
}
