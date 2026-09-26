import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BookOpen, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { queryString } from '../lib/api';
import {
  Badge,
  Empty,
  Field,
  LoadState,
  PageTitle,
  Pagination,
  ResourceCard,
} from '../components/UI';
export default function Resources({ mine = false }) {
  const [params, setParams] = useSearchParams(),
    [draft, setDraft] = useState({
      query: params.get('search') || '',
      value: params.get('search') || '',
    }),
    [filtersOpen, setFiltersOpen] = useState(false);
  const currentSearch = params.get('search') || '',
    search = draft.query === currentSearch ? draft.value : currentSearch,
    setSearch = (value) => setDraft({ query: currentSearch, value });
  const values = Object.fromEntries(params),
    request = useApi('/materials?' + queryString({ ...values, ...(mine ? { mine: 'true' } : {}) })),
    subjects = useApi('/subjects'),
    meta = useApi('/meta');
  function change(key, value) {
    setParams((current) => {
      const p = new URLSearchParams(current);
      p.delete('page');
      value ? p.set(key, value) : p.delete(key);
      return p;
    });
  }
  return (
    <>
      <PageTitle
        eyebrow={mine ? 'YOUR KNOWLEDGE, SHARED' : 'A HEAD START FOR EVERY SUBJECT'}
        title={mine ? 'My contributions' : 'Resource library'}
        description={
          mine
            ? 'Manage your uploads and follow their review status.'
            : 'The notes, papers, and resources that bring everything together.'
        }
        action={
          <Link className="btn" to="/resources/new">
            <Plus size={18} />
            Share a resource
          </Link>
        }
      />
      {mine && (
        <div className="tabs">
          <Link className="active" to="/contributions">
            My resources
          </Link>
          <Link to="/questions?mine=true">My questions</Link>
        </div>
      )}
      <section className="filters-panel">
        <div className="search-row">
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              change('search', search);
            }}
            className="library-search"
          >
            <Search size={20} />
            <input
              aria-label="Search resources"
              placeholder="Search by title, subject, or keyword…"
              value={search}
              maxLength={100}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="btn secondary compact">
              Search
            </button>
          </form>
          <button
            className="btn secondary filter-toggle"
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            <SlidersHorizontal size={18} />
            Filters
          </button>
        </div>
        <div className={'filters ' + (filtersOpen ? 'show' : '')}>
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
          <Field
            label="Category"
            value={params.get('category') || ''}
            onChange={(e) => change('category', e.target.value)}
          >
            <option value="">All categories</option>
            {meta.data?.categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Field>
          <Field
            label="Semester"
            value={params.get('semester') || ''}
            onChange={(e) => change('semester', e.target.value)}
          >
            <option value="">All semesters</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i + 1}>
                Semester {i + 1}
              </option>
            ))}
          </Field>
          <Field
            label="Academic year"
            placeholder="e.g. 2026/2027"
            maxLength={20}
            value={params.get('academicYear') || ''}
            onChange={(e) => change('academicYear', e.target.value)}
          />
          {mine && (
            <Field
              label="Review status"
              value={params.get('status') || ''}
              onChange={(e) => change('status', e.target.value)}
            >
              <option value="">All statuses</option>
              {['pending', 'approved', 'rejected'].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </Field>
          )}
        </div>
      </section>
      <div className="results-heading">
        <span>
          <strong>{request.data?.pagination.total ?? '—'}</strong> resources{' '}
          {params.get('search') && (
            <>
              matching <Badge>“{params.get('search')}”</Badge>
            </>
          )}
        </span>
        <div className="button-row">
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
          <select
            aria-label="Sort resources"
            value={params.get('sort') || 'newest'}
            onChange={(e) => change('sort', e.target.value)}
          >
            <option value="newest">Newest first</option>
            <option value="downloads">Most downloaded</option>
            <option value="useful">Most useful</option>
          </select>
        </div>
      </div>
      <LoadState request={request}>
        {request.data?.items.length ? (
          <div className="resource-grid">
            {request.data.items.map((item) => (
              <ResourceCard item={item} key={item._id} />
            ))}
          </div>
        ) : (
          <div className="panel">
            <Empty
              icon={BookOpen}
              title={params.size ? 'No matching resources' : 'Your library starts here'}
              description={
                params.size
                  ? 'Try a different keyword or clear a filter.'
                  : 'Share a useful resource with your batch. Approved uploads will appear here.'
              }
              action={
                <Link className="btn" to="/resources/new">
                  Share a resource
                </Link>
              }
            />
          </div>
        )}
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
