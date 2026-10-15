// frontend/src/pages/dashboard/StudentDashboard.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  LayoutDashboard,
  Bell,
  User,
  LogOut,
  Search,
  Clock,
  Home as HomeIcon,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  UserCircle,
  Pencil,
  X,
  BookOpen,
  CalendarDays,
  Star,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../services/api";
import "../home/Home.css"; // reuses tag-exam, tag-academic, tag-event, tag-general
import "./StudentDashboard.css";

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
  { id: "notices", label: "Notices", icon: Bell },
  { id: "account", label: "My Account", icon: User },
];

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();

  const [activeTab, setActiveTab] = useState("overview");

  // ── Notices state ──────────────────────────────────────────────────────────
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // ── Expanded notice modal ──────────────────────────────────────────────────
  const [expandedNotice, setExpandedNotice] = useState(null);

  // ── Account form state ─────────────────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({ name: "", email: "" });
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const [pwdForm, setPwdForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwdMsg, setPwdMsg] = useState({ type: "", text: "" });
  const [pwdSaving, setPwdSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Delete account modal ───────────────────────────────────────────────────
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState({ type: "", text: "" });
  const deleteModalRef = useRef(null);

  // ── Fetch notices ──────────────────────────────────────────────────────────
  const fetchNotices = async () => {
    try {
      const response = await apiFetch("/notices");
      if (!response.ok) throw new Error("Failed to load notices");
      const data = await response.json();
      setNotices(data.notices || []);
      setLoadError("");
    } catch {
      setLoadError("Unable to load notices. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  // Sync profile form when user data loads
  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name || "", email: user.email || "" });
    }
  }, [user]);

  // Close delete modal on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setShowDeleteModal(false);
        setDeleteConfirmText("");
        setDeleteMsg({ type: "", text: "" });
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // ── Derived data ───────────────────────────────────────────────────────────
  const recentNotices = notices.slice(0, 5);
  const thisWeekCount = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return notices.filter((n) => new Date(n.createdAt).getTime() >= weekAgo).length;
  }, [notices]);

  const examNotices = useMemo(
    () => notices.filter((n) => n.category?.toLowerCase() === "exam").length,
    [notices]
  );

  const eventNotices = useMemo(
    () => notices.filter((n) => n.category?.toLowerCase() === "event").length,
    [notices]
  );

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

  // ── Profile update ─────────────────────────────────────────────────────────
  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileMsg({ type: "", text: "" });

    if (!profileForm.name.trim() || !profileForm.email.trim()) {
      setProfileMsg({ type: "error", text: "Name and email are required." });
      return;
    }

    setProfileSaving(true);
    try {
      const res = await apiFetch("/auth/profile", {
        method: "PUT",
        body: JSON.stringify({
          name: profileForm.name.trim(),
          email: profileForm.email.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setProfileMsg({ type: "error", text: data.message || "Update failed." });
        return;
      }

      setUser((prev) => ({ ...prev, ...data.user }));
      setProfileMsg({ type: "success", text: "Profile updated successfully." });
      setIsEditingProfile(false);
    } catch {
      setProfileMsg({ type: "error", text: "Could not connect to the server." });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setProfileForm({ name: user?.name || "", email: user?.email || "" });
    setProfileMsg({ type: "", text: "" });
  };

  // ── Password change ────────────────────────────────────────────────────────
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwdMsg({ type: "", text: "" });

    if (!pwdForm.currentPassword || !pwdForm.newPassword || !pwdForm.confirmPassword) {
      setPwdMsg({ type: "error", text: "All password fields are required." });
      return;
    }
    if (pwdForm.newPassword.length < 8) {
      setPwdMsg({ type: "error", text: "New password must be at least 8 characters." });
      return;
    }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdMsg({ type: "error", text: "New passwords do not match." });
      return;
    }

    setPwdSaving(true);
    try {
      const res = await apiFetch("/auth/change-password", {
        method: "PUT",
        body: JSON.stringify({
          currentPassword: pwdForm.currentPassword,
          newPassword: pwdForm.newPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setPwdMsg({ type: "error", text: data.message || "Password update failed." });
        return;
      }

      setPwdMsg({ type: "success", text: "Password changed successfully." });
      setPwdForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch {
      setPwdMsg({ type: "error", text: "Could not connect to the server." });
    } finally {
      setPwdSaving(false);
    }
  };

  // ── Delete account ─────────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      setDeleteMsg({ type: "error", text: 'Type "DELETE" to confirm.' });
      return;
    }
    setDeleting(true);
    setDeleteMsg({ type: "", text: "" });
    try {
      const res = await apiFetch("/auth/delete-account", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setDeleteMsg({ type: "error", text: data.message || "Deletion failed." });
        return;
      }
      await logout();
      navigate("/register");
    } catch {
      setDeleteMsg({ type: "error", text: "Could not connect to the server." });
    } finally {
      setDeleting(false);
    }
  };

  const pageTitles = {
    overview: "Overview",
    notices: "Notices",
    account: "My Account",
  };

  return (
    <div className="sd-layout">
      {/* ── Sidebar ── */}
      <aside className="sd-sidebar">
        <div
          className="sd-brand"
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        >
          <div className="sd-brand-icon" aria-label="AcadHub Logo">
            <GraduationCap size={22} />
          </div>
          <div className="sd-brand-info">
            <h1 className="sd-brand-title">
              Acad<span>Hub</span>
            </h1>
            <span className="sd-brand-role">Student Portal</span>
          </div>
        </div>

        <nav className="sd-nav" aria-label="Student navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={`sd-nav-item ${activeTab === item.id ? "active" : ""}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={17} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="sd-sidebar-footer">
          <button
            type="button"
            className="sd-nav-item"
            onClick={() => navigate("/")}
          >
            <HomeIcon size={17} />
            View public site
          </button>
          <button
            type="button"
            className="sd-nav-item sd-logout"
            onClick={handleLogout}
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="sd-main">
        <header className="sd-topbar">
          <div>
            <h2 className="sd-page-title">{pageTitles[activeTab]}</h2>
            <p className="sd-page-sub">Welcome, {user?.name || "Student"}!</p>
          </div>

          <div className="sd-user-chip">
            <div className="sd-avatar">
              {(user?.name || "S").charAt(0).toUpperCase()}
            </div>
            <div className="sd-user-info">
              <span className="sd-user-name">{user?.name || "Student"}</span>
              <span className="sd-user-role">
                <GraduationCap size={11} />
                {user?.role || "student"}
              </span>
            </div>
          </div>
        </header>

        <main className="sd-content">
          {/* ===== OVERVIEW ===== */}
          {activeTab === "overview" && (
            <>
              {/* Stats */}
              <section className="sd-stats">
                <div className="sd-stat-card">
                  <span className="sd-stat-icon"><Bell size={20} /></span>
                  <span className="sd-stat-label">Total Notices</span>
                  <span className="sd-stat-value">{notices.length}</span>
                  <span className="sd-stat-hint">Published on the site</span>
                </div>
                <div className="sd-stat-card">
                  <span className="sd-stat-icon"><CalendarDays size={20} /></span>
                  <span className="sd-stat-label">This Week</span>
                  <span className="sd-stat-value">{thisWeekCount}</span>
                  <span className="sd-stat-hint">Last 7 days</span>
                </div>
                <div className="sd-stat-card">
                  <span className="sd-stat-icon"><BookOpen size={20} /></span>
                  <span className="sd-stat-label">Exam Notices</span>
                  <span className="sd-stat-value">{examNotices}</span>
                  <span className="sd-stat-hint">Category: Exam</span>
                </div>
                <div className="sd-stat-card">
                  <span className="sd-stat-icon"><Star size={20} /></span>
                  <span className="sd-stat-label">Events</span>
                  <span className="sd-stat-value">{eventNotices}</span>
                  <span className="sd-stat-hint">Category: Event</span>
                </div>
              </section>

              <section className="sd-grid-2">
                {/* Recent notices */}
                <div className="sd-panel">
                  <header className="sd-panel-header">
                    <h3>Recent Notices</h3>
                    <button
                      type="button"
                      className="sd-link-btn"
                      onClick={() => setActiveTab("notices")}
                    >
                      View all
                    </button>
                  </header>

                  {loading ? (
                    <p className="sd-empty">Loading...</p>
                  ) : loadError ? (
                    <p className="sd-empty sd-empty-error">{loadError}</p>
                  ) : recentNotices.length === 0 ? (
                    <p className="sd-empty">No notices yet.</p>
                  ) : (
                    <ul className="sd-recent-list">
                      {recentNotices.map((n) => (
                        <li
                          key={n._id}
                          className="sd-recent-item"
                          onClick={() => setExpandedNotice(n)}
                          style={{ cursor: "pointer" }}
                        >
                          <div className="sd-recent-top">
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
                          <span className="sd-recent-title">{n.title}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Quick account card */}
                <div className="sd-panel">
                  <header className="sd-panel-header">
                    <h3>My Profile</h3>
                    <button
                      type="button"
                      className="sd-link-btn"
                      onClick={() => setActiveTab("account")}
                    >
                      Manage
                    </button>
                  </header>
                  <div className="sd-profile-card">
                    <div className="sd-profile-avatar-lg">
                      {(user?.name || "S").charAt(0).toUpperCase()}
                    </div>
                    <div className="sd-profile-details">
                      <p className="sd-profile-name">{user?.name}</p>
                      <p className="sd-profile-email">
                        <Mail size={13} />
                        {user?.email}
                      </p>
                      <span className="sd-role-badge">
                        <GraduationCap size={12} />
                        {user?.role || "student"}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="sd-primary-btn sd-edit-profile-btn"
                      onClick={() => {
                        setActiveTab("account");
                        setIsEditingProfile(true);
                      }}
                    >
                      <Pencil size={14} />
                      Edit Profile
                    </button>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* ===== NOTICES ===== */}
          {activeTab === "notices" && (
            <div className="sd-panel">
              <div className="sd-toolbar">
                <div className="sd-search">
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
                  className="sd-select"
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
                <p className="sd-empty">Loading notices...</p>
              ) : loadError ? (
                <p className="sd-empty sd-empty-error">{loadError}</p>
              ) : visibleNotices.length === 0 ? (
                <p className="sd-empty">No notices match your filters.</p>
              ) : (
                <ul className="sd-notices-list">
                  {visibleNotices.map((n) => (
                    <li
                      key={n._id}
                      className="sd-notice-card"
                      onClick={() => setExpandedNotice(n)}
                    >
                      <div className="sd-notice-card-top">
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
                      <h4 className="sd-notice-title">{n.title}</h4>
                      <p className="sd-notice-snippet">{n.content}</p>
                      <button type="button" className="sd-read-more-btn">
                        <Eye size={13} />
                        Read more
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* ===== ACCOUNT ===== */}
          {activeTab === "account" && (
            <div className="sd-account-grid">
              {/* Profile info */}
              <div className="sd-panel sd-account-panel">
                <header className="sd-panel-header">
                  <h3>
                    <UserCircle size={18} />
                    Personal Information
                  </h3>
                  {!isEditingProfile && (
                    <button
                      type="button"
                      className="sd-link-btn"
                      onClick={() => setIsEditingProfile(true)}
                    >
                      <Pencil size={13} />
                      Edit
                    </button>
                  )}
                </header>

                {!isEditingProfile ? (
                  <div className="sd-profile-view">
                    <div className="sd-profile-view-avatar">
                      {(user?.name || "S").charAt(0).toUpperCase()}
                    </div>
                    <div className="sd-info-rows">
                      <div className="sd-info-row">
                        <span className="sd-info-label">Full Name</span>
                        <span className="sd-info-value">{user?.name}</span>
                      </div>
                      <div className="sd-info-row">
                        <span className="sd-info-label">Email</span>
                        <span className="sd-info-value">{user?.email}</span>
                      </div>
                      <div className="sd-info-row">
                        <span className="sd-info-label">Role</span>
                        <span className="sd-role-badge">
                          <GraduationCap size={12} />
                          {user?.role || "student"}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleProfileSave} className="sd-form">
                    {profileMsg.text && (
                      <div className={`sd-alert ${profileMsg.type}`} role="alert">
                        {profileMsg.type === "success" ? (
                          <CheckCircle2 size={16} />
                        ) : (
                          <AlertCircle size={16} />
                        )}
                        {profileMsg.text}
                      </div>
                    )}

                    <div className="sd-field">
                      <label htmlFor="sd-name">Full Name</label>
                      <input
                        id="sd-name"
                        type="text"
                        value={profileForm.name}
                        onChange={(e) =>
                          setProfileForm((f) => ({ ...f, name: e.target.value }))
                        }
                        placeholder="Your full name"
                        required
                      />
                    </div>

                    <div className="sd-field">
                      <label htmlFor="sd-email">Email Address</label>
                      <input
                        id="sd-email"
                        type="email"
                        value={profileForm.email}
                        onChange={(e) =>
                          setProfileForm((f) => ({ ...f, email: e.target.value }))
                        }
                        placeholder="your@email.com"
                        required
                      />
                    </div>

                    <div className="sd-form-actions">
                      <button
                        type="button"
                        className="sd-secondary-btn"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="sd-primary-btn"
                        disabled={profileSaving}
                      >
                        {profileSaving ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Change password */}
              <div className="sd-panel sd-account-panel">
                <header className="sd-panel-header">
                  <h3>
                    <Lock size={18} />
                    Change Password
                  </h3>
                </header>

                <form onSubmit={handlePasswordChange} className="sd-form">
                  {pwdMsg.text && (
                    <div className={`sd-alert ${pwdMsg.type}`} role="alert">
                      {pwdMsg.type === "success" ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <AlertCircle size={16} />
                      )}
                      {pwdMsg.text}
                    </div>
                  )}

                  <div className="sd-field">
                    <label htmlFor="sd-cur-pwd">Current Password</label>
                    <div className="sd-pwd-wrap">
                      <input
                        id="sd-cur-pwd"
                        type={showCurrent ? "text" : "password"}
                        value={pwdForm.currentPassword}
                        onChange={(e) =>
                          setPwdForm((f) => ({ ...f, currentPassword: e.target.value }))
                        }
                        placeholder="Enter current password"
                        autoComplete="current-password"
                        required
                      />
                      <button
                        type="button"
                        className="sd-eye-btn"
                        onClick={() => setShowCurrent((v) => !v)}
                        aria-label="Toggle visibility"
                      >
                        {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div className="sd-field">
                    <label htmlFor="sd-new-pwd">New Password</label>
                    <div className="sd-pwd-wrap">
                      <input
                        id="sd-new-pwd"
                        type={showNew ? "text" : "password"}
                        value={pwdForm.newPassword}
                        onChange={(e) =>
                          setPwdForm((f) => ({ ...f, newPassword: e.target.value }))
                        }
                        placeholder="Min 8 characters"
                        autoComplete="new-password"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        className="sd-eye-btn"
                        onClick={() => setShowNew((v) => !v)}
                        aria-label="Toggle visibility"
                      >
                        {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div className="sd-field">
                    <label htmlFor="sd-confirm-pwd">Confirm New Password</label>
                    <div className="sd-pwd-wrap">
                      <input
                        id="sd-confirm-pwd"
                        type={showConfirm ? "text" : "password"}
                        value={pwdForm.confirmPassword}
                        onChange={(e) =>
                          setPwdForm((f) => ({ ...f, confirmPassword: e.target.value }))
                        }
                        placeholder="Repeat new password"
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        className="sd-eye-btn"
                        onClick={() => setShowConfirm((v) => !v)}
                        aria-label="Toggle visibility"
                      >
                        {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div className="sd-form-actions">
                    <button
                      type="button"
                      className="sd-secondary-btn"
                      onClick={() => {
                        setPwdForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                        setPwdMsg({ type: "", text: "" });
                      }}
                    >
                      Clear
                    </button>
                    <button
                      type="submit"
                      className="sd-primary-btn"
                      disabled={pwdSaving}
                    >
                      {pwdSaving ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Danger zone */}
              <div className="sd-panel sd-danger-panel">
                <header className="sd-panel-header sd-danger-header">
                  <h3>Danger Zone</h3>
                </header>
                <div className="sd-danger-body">
                  <div className="sd-danger-info">
                    <p className="sd-danger-title">Delete Account</p>
                    <p className="sd-danger-desc">
                      Permanently delete your account and all associated data. This
                      action cannot be undone.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="sd-danger-btn"
                    onClick={() => {
                      setShowDeleteModal(true);
                      setDeleteConfirmText("");
                      setDeleteMsg({ type: "", text: "" });
                    }}
                  >
                    Delete My Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ===== NOTICE DETAIL MODAL ===== */}
      {expandedNotice && (
        <div
          className="sd-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setExpandedNotice(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Notice detail"
        >
          <div className="sd-modal">
            <div className="sd-modal-header">
              <div className="sd-modal-meta">
                <span
                  className={`notice-tag ${
                    TAG_CLASSES[expandedNotice.category?.toLowerCase()] || "tag-general"
                  }`}
                >
                  {expandedNotice.category}
                </span>
                <span className="notice-date">
                  <Clock size={12} />
                  {formatDate(expandedNotice.createdAt)}
                </span>
              </div>
              <button
                type="button"
                className="sd-icon-btn"
                onClick={() => setExpandedNotice(null)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="sd-modal-body">
              <h3 className="sd-modal-title">{expandedNotice.title}</h3>
              <p className="sd-modal-content">{expandedNotice.content}</p>
            </div>
          </div>
        </div>
      )}

      {/* ===== DELETE ACCOUNT MODAL ===== */}
      {showDeleteModal && (
        <div
          className="sd-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeleteModal(false);
              setDeleteConfirmText("");
              setDeleteMsg({ type: "", text: "" });
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Delete account confirmation"
        >
          <div className="sd-modal sd-delete-modal" ref={deleteModalRef}>
            <div className="sd-modal-header">
              <h3 className="sd-delete-modal-title">Delete Account</h3>
              <button
                type="button"
                className="sd-icon-btn"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                  setDeleteMsg({ type: "", text: "" });
                }}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="sd-modal-body">
              <p className="sd-delete-warning">
                ⚠️ This will permanently delete your account and all your data.
                You will be logged out immediately and cannot undo this action.
              </p>

              {deleteMsg.text && (
                <div className={`sd-alert ${deleteMsg.type}`} role="alert">
                  {deleteMsg.type === "success" ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <AlertCircle size={16} />
                  )}
                  {deleteMsg.text}
                </div>
              )}

              <div className="sd-field" style={{ marginTop: "1rem" }}>
                <label htmlFor="sd-delete-confirm">
                  Type <strong>DELETE</strong> to confirm
                </label>
                <input
                  id="sd-delete-confirm"
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>

              <div className="sd-form-actions" style={{ marginTop: "1rem" }}>
                <button
                  type="button"
                  className="sd-secondary-btn"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText("");
                    setDeleteMsg({ type: "", text: "" });
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="sd-danger-btn"
                  onClick={handleDeleteAccount}
                  disabled={deleting || deleteConfirmText !== "DELETE"}
                >
                  {deleting ? "Deleting..." : "Yes, Delete My Account"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
