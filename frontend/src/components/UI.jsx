import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  FolderOpen,
  Link2,
  LoaderCircle,
  ThumbsUp,
  X,
} from 'lucide-react';
import { bytes, date } from '../lib/api';

export function Button({
  children,
  busy = false,
  variant = '',
  className = '',
  disabled = false,
  ...props
}) {
  return (
    <button className={'btn ' + variant + ' ' + className} disabled={busy || disabled} {...props}>
      {busy && <LoaderCircle className="spin" size={17} />} {children}
    </button>
  );
}
export function Badge({ children, tone = '' }) {
  return <span className={'badge ' + tone}>{children}</span>;
}
export function Avatar({ name = '', small = false }) {
  return (
    <span aria-hidden="true" className={'avatar ' + (small ? 'small' : '')}>
      {name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((v) => v[0])
        .join('')
        .toUpperCase() || '?'}
    </span>
  );
}
export function PageTitle({ eyebrow, title, description, action }) {
  return (
    <div className="page-title">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function Field({ label, error, hint, children, ...props }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {props.required && <span aria-hidden="true"> *</span>}
      </label>
      {children ? (
        <select
          id={id}
          aria-invalid={!!error}
          aria-describedby={error || hint ? id + '-help' : undefined}
          {...props}
        >
          {children}
        </select>
      ) : props.multiline ? (
        <textarea
          id={id}
          aria-invalid={!!error}
          aria-describedby={error || hint ? id + '-help' : undefined}
          {...Object.fromEntries(Object.entries(props).filter(([key]) => key !== 'multiline'))}
        />
      ) : (
        <input
          id={id}
          aria-invalid={!!error}
          aria-describedby={error || hint ? id + '-help' : undefined}
          {...props}
        />
      )}{' '}
      {(error || hint) && (
        <small id={id + '-help'} className={error ? 'field-error' : 'muted'}>
          {error || hint}
        </small>
      )}
    </div>
  );
}
export function FormError({ error }) {
  if (!error) return null;
  return (
    <div className="notice error" role="alert">
      <AlertCircle size={18} />
      <div>
        {error.message || error}
        {error.fields && (
          <ul>
            {Object.entries(error.fields).map(([key, value]) => (
              <li key={key}>{value}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
export function Loading({ label = 'Loading your workspace…' }) {
  return (
    <div className="loading" role="status">
      <LoaderCircle size={25} className="spin" />
      <span>{label}</span>
    </div>
  );
}
export function Empty({
  title = 'Nothing here yet',
  description,
  action,
  icon: Icon = FolderOpen,
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon size={29} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function LoadState({ request, children }) {
  if (request.loading) return <Loading />;
  if (request.error)
    return (
      <div className="panel">
        <FormError error={request.error} />
        <Button variant="secondary" onClick={request.reload}>
          Try again
        </Button>
      </div>
    );
  return children;
}
export function Pagination({ pagination, onChange }) {
  if (!pagination || pagination.pages <= 1) return null;
  return (
    <nav className="pagination" aria-label="Pagination">
      <span>
        {pagination.total} results · Page {pagination.page} of {pagination.pages}
      </span>
      <div className="button-row">
        <Button
          variant="secondary compact"
          disabled={pagination.page <= 1}
          onClick={() => onChange(pagination.page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={17} />
        </Button>
        <Button
          variant="secondary compact"
          disabled={pagination.page >= pagination.pages}
          onClick={() => onChange(pagination.page + 1)}
          aria-label="Next page"
        >
          <ChevronRight size={17} />
        </Button>
      </div>
    </nav>
  );
}
export function Modal({ title, children, onClose }) {
  const ref = useRef(null),
    id = useId();
  useEffect(() => {
    const element = ref.current;
    element.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      element.close();
      document.body.style.overflow = old;
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      className="modal"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal-heading">
        <h2 id={id}>{title}</h2>
        <button className="icon-btn" aria-label="Close dialog" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Confirm({
  title = 'Remove this content?',
  description = 'This action cannot be undone.',
  onConfirm,
  onClose,
  confirmLabel = 'Remove',
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(null);
  return (
    <Modal title={title} onClose={() => !busy && onClose()}>
      <p className="muted">{description}</p>
      <FormError error={error} />
      <div className="modal-actions">
        <Button variant="secondary" disabled={busy} onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="danger"
          busy={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onConfirm();
              onClose();
            } catch (e) {
              setError(e);
              setBusy(false);
            }
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
export function ResourceCard({ item, compact = false }) {
  return (
    <article className={'resource-card ' + (compact ? 'compact-card' : '')}>
      <div className="card-top">
        <span
          className={
            'file-icon ' +
            (item.link ? 'mint' : item.category === 'Past papers' ? 'peach' : 'lavender')
          }
        >
          {item.link ? <Link2 size={22} /> : <FileText size={22} />}
        </span>
        <Badge>{item.category}</Badge>
      </div>
      <div className="resource-card-body">
        <span className="subject-code">
          {item.subject?.code || 'Subject'} · Semester {item.semester}
        </span>
        <h3>
          <Link to={'/resources/' + item._id}>{item.title}</Link>
        </h3>
        <p className="clamp">{item.description}</p>
        <div className="resource-meta">
          <span>{item.academicYear}</span>
          <span>{bytes(item.file?.size)}</span>
          {item.status !== 'approved' && <Badge tone={item.status}>{item.status}</Badge>}
        </div>
      </div>
      <div className="card-footer">
        <span className="person">
          <Avatar name={item.uploader?.name} small />
          <span>{item.uploader?.name || 'Batchmate'}</span>
        </span>
        <span className="metric" title="Downloads">
          <Download size={14} />
          {item.downloadCount}
        </span>
        <span className="metric" title="Useful votes">
          <ThumbsUp size={14} />
          {item.usefulCount}
        </span>
      </div>
    </article>
  );
}
export function QuestionRow({ item }) {
  return (
    <article className="question-row">
      <div className={'answer-count ' + (item.acceptedAnswer ? 'solved' : '')}>
        <strong>{item.acceptedAnswer ? <CheckCircle2 size={19} /> : item.answerCount}</strong>
        <span>{item.acceptedAnswer ? 'solved' : 'answers'}</span>
      </div>
      <div className="question-content">
        <h3>
          <Link to={'/questions/' + item._id}>{item.title}</Link>
        </h3>
        <div className="tags">
          {item.subject && <Badge>{item.subject.code}</Badge>}
          {item.tags?.map((tag) => (
            <span className="tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>
        <div className="muted small-text">
          {item.author?.name || 'Batchmate'} <span aria-hidden="true">·</span>{' '}
          {date(item.createdAt)}
        </div>
      </div>
      <Link className="icon-btn" aria-label={'Read ' + item.title} to={'/questions/' + item._id}>
        <ArrowRight size={19} />
      </Link>
    </article>
  );
}
export function Stat({ icon: Icon = BookOpen, label, value, tone = 'lavender', note }) {
  return (
    <div className="stat">
      <span className={'stat-icon ' + tone}>
        <Icon size={21} />
      </span>
      <div>
        <span>{label}</span>
        <strong>{value?.toLocaleString() ?? '—'}</strong>
        {note && <small>{note}</small>}
      </div>
    </div>
  );
}
export function SectionHeading({ title, to, label = 'View all' }) {
  return (
    <div className="section-heading">
      <h2>{title}</h2>
      {to && (
        <Link to={to}>
          {label}
          <ArrowRight size={15} />
        </Link>
      )}
    </div>
  );
}
