import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  Bell,
  Clock,
  Search,
  ChevronDown,
} from "lucide-react";
import "../home/Home.css";
import "./AllNotices.css";

const FILTERS = ["All", "General", "CA", "Exam", "Academic", "Event"];

const TAG_CLASSES = {
  general: "tag-general",
  ca: "tag-academic",
  exam: "tag-exam",
  academic: "tag-academic",
  event: "tag-event",
};

const getNoticeTagClass = (category) =>
  TAG_CLASSES[category?.toLowerCase()] || "tag-general";

const formatNoticeDate = (date) =>
  new Date(date).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const AllNotices = () => {
  const navigate = useNavigate();

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/notices");

        if (!response.ok) {
          throw new Error("Failed to load notices");
        }

        const data = await response.json();
        setNotices(data.notices || []);
      } catch (err) {
        setError("Unable to load notices. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchNotices();
  }, []);

  // Number of notices in each category (for the filter badges)
  const counts = useMemo(() => {
    const result = { All: notices.length };
    FILTERS.slice(1).forEach((f) => {
      result[f] = notices.filter(
        (n) => n.category?.toLowerCase() === f.toLowerCase()
      ).length;
    });
    return result;
  }, [notices]);

  const visibleNotices = useMemo(() => {
    const term = search.trim().toLowerCase();

    return notices.filter((notice) => {
      const matchesCategory =
        activeFilter === "All" ||
        notice.category?.toLowerCase() === activeFilter.toLowerCase();

      const matchesSearch =
        !term ||
        notice.title?.toLowerCase().includes(term) ||
        notice.content?.toLowerCase().includes(term);

      return matchesCategory && matchesSearch;
    });
  }, [notices, activeFilter, search]);

  const toggleExpand = (id) =>
    setExpandedId((current) => (current === id ? null : id));

  return (
    <div className="home-layout">
      {/* Top Navbar (same as Home) */}
      <nav className="home-navbar">
        <div
          className="home-brand"
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        >
          <div className="brand-icon" aria-label="AcadHub Logo">
            <GraduationCap size={24} />
          </div>
          <div className="brand-info">
            <h1 className="brand-title">
              Acad<span>Hub</span>
            </h1>
            <span className="brand-subtitle">
              Centralized Academic Collaboration Workspace
            </span>
          </div>
        </div>

        <div className="navbar-actions">
          <button
            type="button"
            className="nav-btn nav-btn-login"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
          <button
            type="button"
            className="nav-btn nav-btn-register"
            onClick={() => navigate("/register")}
          >
            Register
            <ArrowRight size={15} />
          </button>
        </div>
      </nav>

      <main className="home-main">
        {/* Page header */}
        <section className="all-notices-header">
          <div>
            <button
              type="button"
              className="back-link"
              onClick={() => navigate("/")}
            >
              <ArrowLeft size={14} />
              Back to home
            </button>

            <div className="intro-badge">
              <Bell size={13} />
              Announcements
            </div>

            <h2 className="intro-title">
              All <span>Notices</span>
            </h2>
            <p className="intro-desc">
              Every announcement published on AcadHub, newest first. No login
              required.
            </p>
          </div>

          <div className="stat-pill">
            <span className="pulse-dot"></span>
            <span>{notices.length} notices published</span>
          </div>
        </section>

        {/* Toolbar: filters + search */}
        <section className="all-notices-toolbar">
          <div className="notices-filter-bar all-notices-filters">
            {FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                className={`filter-tab ${
                  activeFilter === filter ? "active" : ""
                }`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
                <span className="filter-count">{counts[filter]}</span>
              </button>
            ))}
          </div>

          <div className="notices-search">
            <Search size={15} />
            <input
              type="text"
              placeholder="Search notices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search notices"
            />
          </div>
        </section>

        {/* Notices grid */}
        {loading ? (
          <div className="notices-state">Loading notices...</div>
        ) : error ? (
          <div className="notices-state notices-state-error">{error}</div>
        ) : visibleNotices.length === 0 ? (
          <div className="notices-state">
            No notices found
            {activeFilter !== "All" ? ` in ${activeFilter}` : ""}
            {search.trim() ? ` matching "${search.trim()}"` : ""}.
          </div>
        ) : (
          <div className="all-notices-grid">
            {visibleNotices.map((notice) => {
              const isOpen = expandedId === notice._id;

              return (
                <article
                  key={notice._id}
                  className={`notice-card ${isOpen ? "open" : ""}`}
                  onClick={() => toggleExpand(notice._id)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isOpen}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleExpand(notice._id);
                    }
                  }}
                >
                  <div className="notice-top-meta">
                    <span
                      className={`notice-tag ${getNoticeTagClass(
                        notice.category
                      )}`}
                    >
                      {notice.category}
                    </span>
                    <span className="notice-date">
                      <Clock size={12} />
                      {formatNoticeDate(notice.createdAt)}
                    </span>
                  </div>

                  <h4 className="notice-card-title">{notice.title}</h4>

                  <p className="notice-card-content">{notice.content}</p>

                  <div className="notice-card-footer">
                    <span>{isOpen ? "Show less" : "Read more"}</span>
                    <ChevronDown size={14} className="notice-chevron" />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer (same as Home) */}
      <footer className="home-footer">
        <div>© 2026 AcadHub · Academic Management System</div>
        <div className="footer-links">
          <a href="#" onClick={(e) => { e.preventDefault(); navigate("/login"); }}>Help & Support</a>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate("/login"); }}>Privacy Policy</a>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate("/login"); }}>Terms of Service</a>
        </div>
      </footer>
    </div>
  );
};

export default AllNotices;
