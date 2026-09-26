import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MessageSquare, Plus, Search } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { queryString } from '../lib/api';
import { Empty, Field, LoadState, PageTitle, Pagination, QuestionRow } from '../components/UI';
export default function Questions() {
  const [params, setParams] = useSearchParams(),
    [draft, setDraft] = useState({
      query: params.get('search') || '',
      value: params.get('search') || '',
    }),
    request = useApi('/questions?' + queryString(Object.fromEntries(params))),
    subjects = useApi('/subjects');
  const currentSearch = params.get('search') || '',
    search = draft.query === currentSearch ? draft.value : currentSearch,
    setSearch = (value) => setDraft({ query: currentSearch, value });
  const change = (key, value) =>
    setParams((p) => {
      p.delete('page');
      value ? p.set(key, value) : p.delete(key);
      return p;
    });
  return (
    <>
      <PageTitle
        eyebrow="SOMEONE ELSE IS WONDERING, TOO"
        title={params.get('mine') ? 'My questions' : 'Questions & answers'}
        description="Ask freely. Explain kindly. Find that lightbulb moment together."
        action={
          <Link className="btn" to="/questions/new">
            <Plus size={18} />
            Ask a question
          </Link>
        }
      />
      <div className="filters-panel">
        <form
          role="search"
          className="library-search"
          onSubmit={(e) => {
            e.preventDefault();
            change('search', search);
          }}
        >
          <Search size={20} />
          <input
            aria-label="Search questions"
            placeholder="Search questions, topics, or subjects…"
            maxLength={100}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn secondary compact">Search</button>
        </form>
        <div className="question-filter-row">
          <div className="tabs">
            <button
              className={!params.get('status') ? 'active' : ''}
              onClick={() => change('status', '')}
            >
              All questions
            </button>
            <button
              className={params.get('status') === 'unanswered' ? 'active' : ''}
              onClick={() => change('status', 'unanswered')}
            >
              Unanswered
            </button>
            <button
              className={params.get('status') === 'solved' ? 'active' : ''}
              onClick={() => change('status', 'solved')}
            >
              Solved
            </button>
          </div>
          <Field
            label="Subject"
            value={params.get('subject') || ''}
            onChange={(e) => change('subject', e.target.value)}
          >
            <option value="">All subjects</option>
            {subjects.data?.items.map((s) => (
              <option key={s._id} value={s._id}>
                {s.code} · {s.name}
              </option>
            ))}
          </Field>
        </div>
      </div>
      <div className="results-heading">
        <span>
          <strong>{request.data?.pagination.total ?? '—'}</strong> questions
        </span>
        {params.size > 0 && (
          <button
            className="text-btn"
            onClick={() => {
              setParams({});
              setSearch('');
            }}
          >
            Clear filters
          </button>
        )}
      </div>
      <LoadState request={request}>
        <div className="panel flush">
          {request.data?.items.length ? (
            request.data.items.map((item) => <QuestionRow item={item} key={item._id} />)
          ) : (
            <Empty
              icon={MessageSquare}
              title="No questions here yet"
              description="Try another search, or ask the question on your mind."
              action={
                <Link className="btn" to="/questions/new">
                  Ask a question
                </Link>
              }
            />
          )}
        </div>
        <Pagination
          pagination={request.data?.pagination}
          onChange={(page) =>
            setParams((p) => {
              p.set('page', page);
              return p;
            })
          }
        />
      </LoadState>
    </>
  );
}
