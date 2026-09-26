import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, FileCheck2, Flag, Search, ShieldCheck, Users } from 'lucide-react';
import { api, bytes, date, queryString } from '../lib/api';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import {
  Badge,
  Button,
  Empty,
  Field,
  FormError,
  LoadState,
  Modal,
  PageTitle,
  Pagination,
  Stat,
} from '../components/UI';
export default function Admin() {
  const [params, setParams] = useSearchParams(),
    tab = ['uploads', 'reports', 'users', 'audit'].includes(params.get('tab'))
      ? params.get('tab')
      : 'uploads',
    { user } = useAuth(),
    stats = useApi('/admin/stats'),
    [dialog, setDialog] = useState(null),
    [search, setSearch] = useState(params.get('search') || '');
  const filter =
      params.get('status') || (tab === 'uploads' ? 'pending' : tab === 'reports' ? 'open' : ''),
    page = params.get('page') || 1;
  const path =
    tab === 'uploads'
      ? '/materials'
      : tab === 'reports'
        ? '/admin/reports'
        : tab === 'users'
          ? '/admin/users'
          : '/admin/audit';
  const request = useApi(
    path +
      '?' +
      queryString({
        page,
        status: filter || undefined,
        search: tab === 'users' ? params.get('search') || undefined : undefined,
      }),
  );
  function change(key, value) {
    setParams((p) => {
      p.delete('page');
      value ? p.set(key, value) : p.delete(key);
      return p;
    });
  }
  const reload = () => {
    request.reload();
    stats.reload();
  };
  return (
    <>
      <PageTitle
        eyebrow="CARE FOR YOUR COMMUNITY"
        title="Moderation workspace"
        description="Keep the library useful, the conversations respectful, and your community trusted."
      />
      <div className="stats-grid admin-stats">
        <Stat
          label="Pending resources"
          value={stats.data?.stats.pendingResources}
          icon={FileCheck2}
        />
        <Stat label="Open reports" value={stats.data?.stats.openReports} icon={Flag} tone="peach" />
        <Stat
          label="Awaiting approval"
          value={stats.data?.stats.pendingUsers}
          icon={Users}
          tone="mint"
        />
        <Stat
          label="Active members"
          value={stats.data?.stats.activeUsers}
          icon={ShieldCheck}
          tone="blue"
        />
      </div>
      <FormError error={stats.error} />
      <div className="admin-toolbar">
        <div className="tabs">
          {[
            ['uploads', 'Resource reviews'],
            ['reports', 'Content reports'],
            ['users', 'Members'],
            ...(user.role === 'admin' ? [['audit', 'Audit log']] : []),
          ].map(([key, label]) => (
            <button
              key={key}
              className={tab === key ? 'active' : ''}
              onClick={() => {
                setParams({ tab: key });
                setSearch('');
              }}
            >
              {label}
            </button>
          ))}
        </div>
        {tab !== 'audit' && (
          <select
            aria-label="Filter moderation status"
            value={filter}
            onChange={(e) => change('status', e.target.value)}
          >
            {tab === 'uploads' ? (
              ['pending', 'approved', 'rejected'].map((v) => <option key={v}>{v}</option>)
            ) : tab === 'reports' ? (
              ['open', 'resolved', 'dismissed'].map((v) => <option key={v}>{v}</option>)
            ) : (
              <>
                <option value="">All account statuses</option>
                {['pending', 'active', 'suspended'].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </>
            )}
          </select>
        )}
      </div>
      {tab === 'users' && (
        <form
          className="library-search admin-search"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            change('search', search);
          }}
        >
          <Search size={18} />
          <input
            aria-label="Search members"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            maxLength={100}
            placeholder="Search by name, email, or department…"
          />
          <button className="btn secondary compact">Search</button>
        </form>
      )}
      <LoadState request={request}>
        {request.data?.items.length ? (
          <div className="panel table-panel">
            <div
              className="table-scroll"
              tabIndex={0}
              role="region"
              aria-label="Moderation records"
            >
              <table>
                <thead>
                  <tr>
                    {(tab === 'uploads'
                      ? ['Resource', 'Shared by', 'Status', 'Review']
                      : tab === 'reports'
                        ? ['Reported content', 'Reason', 'Status', 'Action']
                        : tab === 'users'
                          ? ['Member', 'Academic profile', 'Access', 'Action']
                          : ['Action', 'Performed by', 'Details', 'When']
                    ).map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {request.data.items.map((item) => (
                    <tr key={item._id}>
                      {tab === 'uploads' ? (
                        <>
                          <td>
                            <Link className="table-title" to={'/resources/' + item._id}>
                              {item.title}
                            </Link>
                            <span>
                              {item.subject?.code} · {item.category}
                            </span>
                          </td>
                          <td>
                            {item.uploader?.name}
                            <span>{date(item.createdAt)}</span>
                          </td>
                          <td>
                            <Badge tone={item.status}>{item.status}</Badge>
                          </td>
                          <td>
                            <Button
                              variant="secondary compact"
                              disabled={item.uploader?._id === user.id}
                              onClick={() => setDialog({ type: 'review', item })}
                            >
                              {item.uploader?._id === user.id ? 'Needs another reviewer' : 'Review'}
                            </Button>
                          </td>
                        </>
                      ) : tab === 'reports' ? (
                        <>
                          <td>
                            {item.target.path ? (
                              <Link className="table-title" to={item.target.path}>
                                {item.target.title}
                              </Link>
                            ) : (
                              <strong>{item.target.title}</strong>
                            )}
                            <span>
                              {item.targetType} · Reported by {item.reporter?.name}
                            </span>
                          </td>
                          <td>
                            <strong>{item.reason}</strong>
                            <span className="report-detail">{item.details}</span>
                            {item.resolution && <span>Resolution: {item.resolution}</span>}
                          </td>
                          <td>
                            <Badge tone={item.status}>{item.status}</Badge>
                          </td>
                          <td>
                            <Button
                              variant="secondary compact"
                              onClick={() => setDialog({ type: 'report', item })}
                            >
                              Review report
                            </Button>
                          </td>
                        </>
                      ) : tab === 'users' ? (
                        <>
                          <td>
                            <strong>{item.name}</strong>
                            <span>{item.email}</span>
                          </td>
                          <td>
                            {item.department || 'Not set'}
                            <span>
                              Batch {item.batch || '—'} · Semester {item.semester}
                            </span>
                          </td>
                          <td>
                            <Badge>{item.role}</Badge>{' '}
                            <Badge tone={item.status === 'active' ? 'approved' : item.status}>
                              {item.status}
                            </Badge>
                          </td>
                          <td>
                            <Button
                              variant="secondary compact"
                              disabled={
                                item._id === user.id ||
                                (user.role === 'moderator' &&
                                  (item.role !== 'student' || item.status === 'suspended'))
                              }
                              onClick={() => setDialog({ type: 'user', item })}
                            >
                              {user.role === 'admin' ? 'Manage access' : 'Suspend'}
                            </Button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>
                            <strong>{item.action.replaceAll('.', ' · ')}</strong>
                            <span>{item.targetType}</span>
                          </td>
                          <td>{item.actor?.name || 'Administrator'}</td>
                          <td className="audit-details">{item.details || '—'}</td>
                          <td>
                            {date(item.createdAt)}
                            <span>{new Date(item.createdAt).toLocaleTimeString()}</span>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="panel">
            <Empty
              icon={CheckCircle2}
              title="You’re all caught up."
              description="There are no records matching this view."
            />
          </div>
        )}
        <Pagination
          pagination={request.data?.pagination}
          onChange={(value) =>
            setParams((p) => {
              p.set('page', value);
              return p;
            })
          }
        />
      </LoadState>
      {stats.data && (
        <p className="small-text muted admin-footnote">
          Stored resources: {bytes(stats.data.stats.storageBytes) || '0 KB'} ·{' '}
          {stats.data.stats.downloads} downloads · {stats.data.stats.suspendedUsers} suspended
          accounts
        </p>
      )}
      {dialog && (
        <ActionDialog
          {...dialog}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null);
            reload();
          }}
        />
      )}
    </>
  );
}
function ActionDialog({ type, item, onClose, onSaved }) {
  const { user } = useAuth(),
    notify = useToast(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(null),
    [status, setStatus] = useState(
      type === 'review'
        ? 'approved'
        : type === 'report'
          ? 'resolved'
          : user.role === 'moderator'
            ? 'suspended'
            : item.status,
    ),
    [role, setRole] = useState(item.role || 'student'),
    [reason, setReason] = useState('');
  const title =
    type === 'review'
      ? 'Review resource'
      : type === 'report'
        ? 'Resolve content report'
        : 'Manage member access';
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const path =
      type === 'review'
        ? '/admin/materials/'
        : type === 'report'
          ? '/admin/reports/'
          : '/admin/users/';
    const body =
      type === 'review'
        ? { status, reason, expectedUpdatedAt: item.updatedAt }
        : type === 'report'
          ? { status, resolution: reason }
          : { status, ...(user.role === 'admin' ? { role } : {}), reason };
    try {
      const result = await api(path + item._id, { method: 'PATCH', body });
      notify(result.message);
      onSaved();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={title} onClose={() => !busy && onClose()}>
      <p className="muted">{item.title || item.name || item.target?.title}</p>
      {type === 'review' && (
        <>
          <p className="prose">{item.description}</p>
          <Link className="text-link" to={'/resources/' + item._id} target="_blank">
            Inspect resource and file before approving ↗
          </Link>
        </>
      )}
      {type === 'report' && (
        <>
          <div className="notice">{item.details}</div>
          <p className="small-text muted">
            Review the linked content and remove it if needed before marking this report resolved.
            Resolving a report records your decision.
          </p>
          {item.target?.path && (
            <Link className="text-link" to={item.target.path} target="_blank">
              Inspect reported content ↗
            </Link>
          )}
        </>
      )}
      <form onSubmit={submit}>
        <FormError error={error} />
        {type === 'user' && user.role === 'admin' && (
          <Field label="Role" value={role} onChange={(e) => setRole(e.target.value)}>
            {['student', 'moderator', 'admin'].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </Field>
        )}
        <Field
          label={type === 'user' ? 'Account status' : 'Decision'}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {(type === 'review'
            ? ['approved', 'rejected']
            : type === 'report'
              ? ['resolved', 'dismissed']
              : user.role === 'moderator'
                ? ['suspended']
                : ['active', 'pending', 'suspended']
          ).map((v) => (
            <option key={v}>{v}</option>
          ))}
        </Field>
        <Field
          label={type === 'report' ? 'Resolution notes' : 'Reason / review notes'}
          multiline
          rows={4}
          minLength={type === 'review' && status === 'approved' ? 0 : 5}
          maxLength={type === 'user' ? 500 : 1000}
          required={!(type === 'review' && status === 'approved')}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          hint="This decision is recorded in the administrative audit log."
        />
        <div className="modal-actions">
          <Button type="button" variant="secondary" disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          <Button busy={busy}>Confirm decision</Button>
        </div>
      </form>
    </Modal>
  );
}
