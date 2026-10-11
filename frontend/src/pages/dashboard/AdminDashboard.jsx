import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  LayoutDashboard,
  Bell,
  PlusCircle,
  LogOut,
  Trash2,
  Search,
  Clock,
  Home as HomeIcon,
  CheckCircle2,
  AlertCircle,
  Shield,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../services/api";
import "../home/Home.css"; // reuses tag-exam, tag-academic, tag-event, tag-general
import "./AdminDashboard.css";

const CATEGORIES = ["general", "ca", "exam", "academic", "event"];

const CATEGORY_LABELS = {
  general: "General",
  ca: "CA",
  exam: "Exam",
  academic: "Academic",
  event: "Event",
};

const TAG_CLASSES = {
  general: "tag-general",
  ca: "tag-academic",
  exam: "tag-exam",
  academic: "tag-academic",
  event: "tag-event",
};

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "notices", label: "Manage Notices", icon: Bell },
  { id: "create", label: "Create Notice", icon: PlusCircle },
];

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState("overview");

  // Notices data
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Manage tab filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Create form
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("general");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState({ type: "", text: "" });

  const fetchNotices = async () => {
    try {
      const response = await apiFetch("/notices");
      if (!response.ok) throw new Error("Failed to load notices");

      const data = await response.json();
      setNotices(data.notices || []);
      setLoadError("");
    } catch (error) {
      setLoadError("Unable to load notices. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormMessage({ type: "", text: "" });

    if (!title.trim() || !content.trim()) {
      setFormMessage({
        type: "error",
        text: "Title and content are required.",
      });
      return;
    }

    setSubmitting(true);

    try {
      const response = await apiFetch("/notices", {
        method: "POST",
        body: JSON.stringify({ title, content, category }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFormMessage({
          type: "error",
          text: data.message || "Failed to create notice.",
        });
        return;
      }

      // Add new notice to the top of the list
      setNotices((current) => [data.notice, ...current]);
      setTitle("");
      setContent("");
      setCategory("general");
      setFormMessage({ type: "success", text: "Notice published successfully." });
    } catch (error) {
      setFormMessage({
        type: "error",
        text: "Could not connect to the server. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (notice) => {
    const confirmed = window.confirm(`Delete "${notice.title}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      const response = await apiFetch(`/notices/${notice._id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        alert(data.message || "Failed to delete notice.");
        return;
      }

      setNotices((current) => current.filter((n) => n._id !== notice._id));
    } catch (error) {
      alert("Could not connect to the server.");
    }
  };

  // Stats
  const countsByCategory = useMemo(() => {
    const result = {};
    CATEGORIES.forEach((c) => {
      result[c] = notices.filter((n) => n.category?.toLowerCase() === c).length;
    });
    return result;
  }, [notices]);

  const thisWeekCount = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return notices.filter((n) => new Date(n.createdAt).getTime() >= weekAgo).length;
  }, [notices]);

  const maxCategoryCount = Math.max(1, ...Object.values(countsByCategory));

  const visibleNotices = useMemo(() => {
    const term = search.trim().toLowerCase();

    return notices.filter((n) => {
      const matchesCategory =
        categoryFilter === "all" || n.category?.toLowerCase() === categoryFilter;
      const matchesSearch =
        !term ||
        n.title?.toLowerCase().includes(term) ||
        n.content?.toLowerCase().includes(term);

      return matchesCategory && matchesSearch;
    });
  }, [notices, search, categoryFilter]);

  const recentNotices = notices.slice(0, 5);

  const pageTitles = {
    overview: "Overview",
    notices: "Manage Notices",
    create: "Create Notice",
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div
          className="admin-brand"
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        >
          <div className="brand-icon" aria-label="AcadHub Logo">
            <GraduationCap size={22} />
          </div>
          <div className="brand-info">
            <h1 className="brand-title">
              Acad<span>Hub</span>
            </h1>
            <span className="admin-brand-role">Admin Console</span>
          </div>
        </div>

        <nav className="admin-nav" aria-label="Admin navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={`admin-nav-item ${activeTab === item.id ? "active" : ""}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={17} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <button
            type="button"
            className="admin-nav-item"
            onClick={() => navigate("/")}
          >
            <HomeIcon size={17} />
            View public site
          </button>
          <button
            type="button"
            className="admin-nav-item admin-logout"
            onClick={handleLogout}
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <h2 className="admin-page-title">{pageTitles[activeTab]}</h2>
            <p className="admin-page-sub">
              Welcome back, {user?.name || "Admin"}
            </p>
          </div>

          <div className="admin-user-chip">
            <div className="admin-avatar">
              {(user?.name || "A").charAt(0).toUpperCase()}
            </div>
            <div className="admin-user-info">
              <span className="admin-user-name">{user?.name || "Admin"}</span>
              <span className="admin-user-role">
                <Shield size={11} />
                {user?.role || "admin"}
              </span>
            </div>
          </div>
        </header>

        <main className="admin-content">
          {/* ===== OVERVIEW ===== */}
          {activeTab === "overview" && (
            <>
              <section className="admin-stats">
                <div className="admin-stat-card">
                  <span className="admin-stat-label">Total notices</span>
                  <span className="admin-stat-value">{notices.length}</span>
                  <span className="admin-stat-hint">Published on the site</span>
                </div>
                <div className="admin-stat-card">
                  <span className="admin-stat-label">This week</span>
                  <span className="admin-stat-value">{thisWeekCount}</span>
                  <span className="admin-stat-hint">Last 7 days</span>
                </div>
                <div className="admin-stat-card">
                  <span className="admin-stat-label">Exam notices</span>
                  <span className="admin-stat-value">{countsByCategory.exam}</span>
                  <span className="admin-stat-hint">Category: Exam</span>
                </div>
                <div className="admin-stat-card">
                  <span className="admin-stat-label">Events</span>
                  <span className="admin-stat-value">{countsByCategory.event}</span>
                  <span className="admin-stat-hint">Category: Event</span>
                </div>
              </section>

              <section className="admin-grid-2">
                {/* Category breakdown */}
                <div className="admin-panel">
                  <header className="admin-panel-header">
                    <h3>Notices by category</h3>
                  </header>
                  <div className="admin-bars">
                    {CATEGORIES.map((c) => (
                      <div key={c} className="admin-bar-row">
                        <span className={`notice-tag ${TAG_CLASSES[c]}`}>
                          {CATEGORY_LABELS[c]}
                        </span>
                        <div className="admin-bar-track">
                          <div
                            className="admin-bar-fill"
                            style={{
                              width: `${(countsByCategory[c] / maxCategoryCount) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="admin-bar-count">{countsByCategory[c]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent notices */}
                <div className="admin-panel">
                  <header className="admin-panel-header">
                    <h3>Recent notices</h3>
                    <button
                      type="button"
                      className="admin-link-btn"
                      onClick={() => setActiveTab("notices")}
                    >
                      View all
                    </button>
                  </header>

                  {loading ? (
                    <p className="admin-empty">Loading...</p>
                  ) : loadError ? (
                    <p className="admin-empty admin-empty-error">{loadError}</p>
                  ) : recentNotices.length === 0 ? (
                    <p className="admin-empty">No notices yet.</p>
                  ) : (
                    <ul className="admin-recent-list">
                      {recentNotices.map((n) => (
                        <li key={n._id} className="admin-recent-item">
                          <div className="admin-recent-top">
                            <span
                              className={`notice-tag ${
                                TAG_CLASSES[n.category?.toLowerCase()] || "tag-general"
                              }`}
                            >
                              {n.category}
                            </span>
                            <span className="notice-date">
                              <Clock size={12} />
                              {formatDate(n.createdAt)}
                            </span>
                          </div>
                          <span className="admin-recent-title">{n.title}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>

              <button
                type="button"
                className="admin-primary-btn admin-cta"
                onClick={() => setActiveTab("create")}
              >
                <PlusCircle size={16} />
                Publish a new notice
              </button>
            </>
          )}

          {/* ===== MANAGE NOTICES ===== */}
          {activeTab === "notices" && (
            <div className="admin-panel">
              <div className="admin-toolbar">
                <div className="admin-search">
                  <Search size={15} />
                  <input
                    type="text"
                    placeholder="Search notices..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    aria-label="Search notices"
                  />
                </div>

                <select
                  className="admin-select"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  aria-label="Filter by category"
                >
                  <option value="all">All categories</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </select>
              </div>

              {loading ? (
                <p className="admin-empty">Loading notices...</p>
              ) : loadError ? (
                <p className="admin-empty admin-empty-error">{loadError}</p>
              ) : visibleNotices.length === 0 ? (
                <p className="admin-empty">No notices match your filters.</p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Published</th>
                        <th aria-label="Actions" />
                      </tr>
                    </thead>
                    <tbody>
                      {visibleNotices.map((n) => (
                        <tr key={n._id}>
                          <td>
                            <div className="admin-cell-title">{n.title}</div>
                            <div className="admin-cell-snippet">{n.content}</div>
                          </td>
                          <td>
                            <span
                              className={`notice-tag ${
                                TAG_CLASSES[n.category?.toLowerCase()] || "tag-general"
                              }`}
                            >
                              {n.category}
                            </span>
                          </td>
                          <td className="admin-cell-date">{formatDate(n.createdAt)}</td>
                          <td className="admin-cell-actions">
                            <button
                              type="button"
                              className="admin-icon-btn danger"
                              onClick={() => handleDelete(n)}
                              aria-label={`Delete ${n.title}`}
                              title="Delete"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ===== CREATE NOTICE ===== */}
          {activeTab === "create" && (
            <div className="admin-panel admin-form-panel">
              <header className="admin-panel-header">
                <h3>New announcement</h3>
              </header>

              <form onSubmit={handleCreate} className="admin-form">
                {formMessage.text && (
                  <div
                    className={`admin-alert ${formMessage.type}`}
                    role="alert"
                  >
                    {formMessage.type === "success" ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <AlertCircle size={16} />
                    )}
                    {formMessage.text}
                  </div>
                )}

                <div className="admin-field">
                  <label htmlFor="notice-title">Title</label>
                  <input
                    id="notice-title"
                    type="text"
                    placeholder="e.g. Mid-term exam schedule"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={150}
                    required
                  />
                </div>

                <div className="admin-field">
                  <label htmlFor="notice-category">Category</label>
                  <select
                    id="notice-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {CATEGORY_LABELS[c]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="admin-field">
                  <label htmlFor="notice-content">Content</label>
                  <textarea
                    id="notice-content"
                    rows={7}
                    placeholder="Write the full announcement..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                  />
                </div>

                <div className="admin-form-actions">
                  <button
                    type="button"
                    className="admin-secondary-btn"
                    onClick={() => {
                      setTitle("");
                      setContent("");
                      setCategory("general");
                      setFormMessage({ type: "", text: "" });
                    }}
                  >
                    Clear
                  </button>
                  <button
                    type="submit"
                    className="admin-primary-btn"
                    disabled={submitting}
                  >
                    {submitting ? "Publishing..." : "Publish notice"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
