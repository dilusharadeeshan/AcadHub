import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Pencil,
  ShieldCheck,
  ThumbsUp,
  Trash2,
} from 'lucide-react';
import { api, bytes, date, fileUrl, owns, staff } from '../lib/api';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { Avatar, Badge, Button, Confirm, Empty, LoadState, Pagination } from '../components/UI';
import { BodyForm, DiscussionItem } from '../components/Discussion';
import ReportButton from '../components/ReportButton';
export default function ResourceDetail() {
  const { id } = useParams(),
    request = useApi('/materials/' + id),
    [page, setPage] = useState(1),
    comments = useApi('/materials/' + id + '/comments?page=' + page),
    { user } = useAuth(),
    notify = useToast(),
    navigate = useNavigate();
  const [removing, setRemoving] = useState(false),
    [busy, setBusy] = useState(false);
  const item = request.data?.item,
    owner = owns(user, item?.uploader);
  async function vote() {
    setBusy(true);
    try {
      await api('/materials/' + id + '/vote', {
        method: 'PUT',
        body: { useful: !request.data.useful },
      });
      request.reload();
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setBusy(false);
    }
  }
  async function download() {
    setBusy(true);
    try {
      const response = await fetch(fileUrl(id), { credentials: 'include' });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message);
      }
      const url = URL.createObjectURL(await response.blob()),
        anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = item.file.name;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      request.reload();
    } catch (e) {
      notify(e.message || 'Download failed. Please try again.', 'error');
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Link className="back-link" to="/resources">
        <ArrowLeft size={16} />
        Back to the library
      </Link>
      <LoadState request={request}>
        {item && (
          <>
            <div className="detail-heading">
              <div className="tags">
                <Badge>{item.category}</Badge>
                <Badge tone={item.status}>{item.status}</Badge>
              </div>
              <h1>{item.title}</h1>
              <div className="detail-byline">
                <Avatar name={item.uploader?.name} />
                <span>
                  Shared by <strong>{item.uploader?.name}</strong>
                </span>
                <span className="muted">{date(item.createdAt)}</span>
              </div>
            </div>
            <div className="detail-layout">
              <div>
                <section className="panel">
                  <h2>About this resource</h2>
                  <p className="prose">{item.description}</p>
                  <div className="resource-detail-tags">
                    <Badge>{item.subject?.name}</Badge>
                    <Badge>Semester {item.semester}</Badge>
                    <Badge>{item.academicYear}</Badge>
                  </div>
                  {item.status !== 'approved' && (
                    <div className={'notice ' + (item.status === 'rejected' ? 'error' : '')}>
                      <ShieldCheck size={20} />
                      <div>
                        <strong>
                          {item.status === 'rejected' ? 'Changes requested' : 'Waiting for review'}
                        </strong>
                        <p>
                          {item.moderationReason ||
                            'A moderator will review this resource before it appears in the library.'}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="resource-actions">
                    <button
                      className={'vote-btn ' + (request.data.useful ? 'voted' : '')}
                      disabled={owner || busy || item.status !== 'approved'}
                      aria-pressed={Boolean(request.data.useful)}
                      onClick={vote}
                    >
                      <ThumbsUp size={16} />
                      Useful · {item.usefulCount}
                    </button>
                    <ReportButton targetType="material" targetId={id} />
                    <div className="spacer" />
                    {owner && (
                      <Link className="text-btn" to={'/resources/' + id + '/edit'}>
                        <Pencil size={15} />
                        Edit
                      </Link>
                    )}
                    {(owner || staff(user)) && (
                      <button className="text-btn danger-text" onClick={() => setRemoving(true)}>
                        <Trash2 size={15} />
                        Delete
                      </button>
                    )}
                  </div>
                </section>
                <section className="panel discussion-panel">
                  <h2>
                    Comments{' '}
                    <span className="count-pill">{comments.data?.pagination.total || 0}</span>
                  </h2>
                  <p className="muted">
                    Ask a question, add context, or share a helpful correction.
                  </p>
                  {item.status === 'approved' && (
                    <BodyForm
                      onSubmit={async (body) => {
                        await api('/materials/' + id + '/comments', {
                          method: 'POST',
                          body: { body },
                        });
                        notify('Comment posted.');
                        comments.reload();
                      }}
                    />
                  )}
                  <LoadState request={comments}>
                    {comments.data?.items.length ? (
                      comments.data.items.map((comment) => (
                        <DiscussionItem
                          item={comment}
                          type="comment"
                          key={comment._id}
                          onChange={comments.reload}
                        />
                      ))
                    ) : (
                      <Empty
                        title="Start the conversation"
                        description={
                          item.status === 'approved'
                            ? 'Be the first to add a helpful comment.'
                            : 'Comments will open when this resource is approved.'
                        }
                      />
                    )}
                    <Pagination pagination={comments.data?.pagination} onChange={setPage} />
                  </LoadState>
                </section>
              </div>
              <aside>
                <div className="panel download-card">
                  <span className="file-icon lavender">
                    <FileText size={32} />
                  </span>
                  <h2>{item.link ? 'Explore this academic link' : 'Ready when you are.'}</h2>
                  <p>{item.link ? new URL(item.link).hostname : item.file?.name}</p>
                  <span className="muted small-text">
                    {bytes(item.file?.size)}
                    {item.file?.mime ? ' · ' + item.file.mime.split('/')[1].toUpperCase() : ''}
                  </span>
                  {item.link ? (
                    <a
                      className="btn full-width"
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() =>
                        api('/materials/' + id + '/open', { method: 'POST' })
                          .then(request.reload)
                          .catch((e) => notify(e.message, 'error'))
                      }
                    >
                      <ExternalLink size={17} />
                      Open academic link
                    </a>
                  ) : (
                    <>
                      <Button className="full-width" busy={busy} onClick={download}>
                        <Download size={17} />
                        Download resource
                      </Button>
                      <a
                        className="btn secondary full-width"
                        href={fileUrl(id, true)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Eye size={17} />
                        Preview file
                      </a>
                    </>
                  )}
                  <div className="download-stats">
                    <span>
                      <Download size={16} />
                      {item.downloadCount} downloads
                    </span>
                    <span>
                      <ThumbsUp size={16} />
                      {item.usefulCount} found useful
                    </span>
                  </div>
                </div>
                <div className="community-tip">
                  <ShieldCheck size={23} />
                  <h3>Shared by a peer.</h3>
                  <p>
                    Materials support your learning. They are not official faculty solutions unless
                    verified in the description.
                  </p>
                </div>
              </aside>
            </div>
            {removing && (
              <Confirm
                title="Delete this resource?"
                description="The file and its comments will be permanently removed."
                onClose={() => setRemoving(false)}
                onConfirm={async () => {
                  await api('/materials/' + id, { method: 'DELETE' });
                  notify('Resource removed.');
                  navigate('/contributions');
                }}
              />
            )}
          </>
        )}
      </LoadState>
    </>
  );
}
