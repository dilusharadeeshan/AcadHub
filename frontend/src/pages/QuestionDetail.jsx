import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Pencil, Trash2 } from 'lucide-react';
import { api, date, owns, staff } from '../lib/api';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { Avatar, Badge, Confirm, Empty, LoadState, Pagination } from '../components/UI';
import { BodyForm, DiscussionItem } from '../components/Discussion';
import ReportButton from '../components/ReportButton';
export default function QuestionDetail() {
  const { id } = useParams(),
    request = useApi('/questions/' + id),
    [page, setPage] = useState(1),
    answers = useApi('/questions/' + id + '/answers?page=' + page),
    { user } = useAuth(),
    notify = useToast(),
    navigate = useNavigate(),
    [removing, setRemoving] = useState(false);
  const item = request.data?.item,
    owner = owns(user, item?.author),
    reload = () => {
      request.reload();
      answers.reload();
    };
  return (
    <>
      <Link className="back-link" to="/questions">
        <ArrowLeft size={16} />
        Back to questions
      </Link>
      <LoadState request={request}>
        {item && (
          <div className="question-detail">
            <article className="panel">
              <div className="tags">
                <Badge>{item.subject?.name}</Badge>
                {item.acceptedAnswer && (
                  <Badge tone="approved">
                    <CheckCircle2 size={13} />
                    Solved
                  </Badge>
                )}
              </div>
              <h1>{item.title}</h1>
              <div className="detail-byline">
                <Avatar name={item.author?.name} />
                <span>
                  Asked by <strong>{item.author?.name}</strong>
                </span>
                <span className="muted">{date(item.createdAt)}</span>
              </div>
              <p className="prose">{item.body}</p>
              <div className="tags">
                {item.tags.map((tag) => (
                  <span className="tag" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
              <div className="resource-actions">
                <ReportButton targetType="question" targetId={id} />
                <div className="spacer" />
                {owner && (
                  <Link className="text-btn" to={'/questions/' + id + '/edit'}>
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
            </article>
            <section className="panel discussion-panel">
              <h2>
                {item.answerCount} {item.answerCount === 1 ? 'answer' : 'answers'}
              </h2>
              <p className="muted">A clear explanation can make all the difference.</p>
              <LoadState request={answers}>
                {answers.data?.items.length ? (
                  answers.data.items.map((answer) => (
                    <DiscussionItem
                      item={answer}
                      key={answer._id}
                      type="answer"
                      onChange={reload}
                      accepted={item.acceptedAnswer === answer._id}
                      canAccept={owner}
                      onAccept={async (answerId) => {
                        const data = await api('/questions/' + id + '/accepted-answer', {
                          method: 'PUT',
                          body: { answerId },
                        });
                        notify(data.message);
                      }}
                    />
                  ))
                ) : (
                  <Empty
                    title="A fresh perspective would help"
                    description="Be the first to explain what you know."
                  />
                )}
                <Pagination pagination={answers.data?.pagination} onChange={setPage} />
              </LoadState>
              <BodyForm
                label="Your answer"
                buttonLabel="Post answer"
                onSubmit={async (body) => {
                  await api('/questions/' + id + '/answers', { method: 'POST', body: { body } });
                  notify('Answer posted.');
                  reload();
                }}
              />
            </section>
            {removing && (
              <Confirm
                title="Delete this question?"
                description="This also removes all answers and their votes."
                onClose={() => setRemoving(false)}
                onConfirm={async () => {
                  await api('/questions/' + id, { method: 'DELETE' });
                  notify('Question removed.');
                  navigate('/questions');
                }}
              />
            )}
          </div>
        )}
      </LoadState>
    </>
  );
}
