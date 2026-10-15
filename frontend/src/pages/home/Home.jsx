import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  ArrowRight,
  BookOpen,
  Calendar,
  FileText,
  Library,
  MessageSquare,
  Users,
  Award,
  Bell,
  Clock,
  Sparkles,
  ChevronRight,
  ExternalLink,
  UserCircle,
  LogOut,
  Tag,
  Hash,
  X,
  Search
} from "lucide-react";
import "./Home.css";
import { useAuth } from "../../context/AuthContext";

const PORTAL_CARDS = [
  {
    id: "courses",
    title: "Course Catalog",
    description: "Browse and enroll in academic semester modules, syllabi, and learning guides.",
    icon: BookOpen,
    badge: "8 Courses",
    path: "/login",
  },
  {
    id: "timetable",
    title: "Lecture Timetable",
    description: "View weekly scheduled lectures, laboratory sessions, and hall allocations.",
    icon: Calendar,
    badge: "Updated",
    path: "/login",
  },
  {
    id: "assignments",
    title: "Assignment Hub",
    description: "Track coursework deadlines, submit deliverables, and review grading criteria.",
    icon: FileText,
    badge: "3 Due Soon",
    path: "/login",
  },
  {
    id: "library",
    title: "Digital Library",
    description: "Access institutional e-journals, research papers, and academic repositories.",
    icon: Library,
    badge: "24/7 Access",
    path: "/login",
  },
  {
    id: "forum",
    title: "Student Forum",
    description: "Engage in peer-to-peer academic discussions, Q&A, and project group chats.",
    icon: MessageSquare,
    badge: "Active",
    path: "/login",
  },
  {
    id: "research",
    title: "Research & Projects",
    description: "Discover faculty publications, grant opportunities, and undergraduate theses.",
    icon: GraduationCap,
    badge: "New Call",
    path: "/login",
  },
  {
    id: "faculty",
    title: "Faculty Directory",
    description: "Connect with lecturers, academic advisors, tutors, and department heads.",
    icon: Users,
    badge: "Staff List",
    path: "/login",
  },
  {
    id: "grades",
    title: "Exams & Results",
    description: "Inspect official examination timetables, admission slips, and semester GPAs.",
    icon: Award,
    badge: "Fall 2026",
    path: "/login",
  },
];

const COURSES = [
  {
    id: 1,
    shortName: "ENG2222",
    name: "English IV",
    category: "2024/2025 Semester II",
  },
  {
    id: 2,
    shortName: "ICT2213",
    name: "Operating System Concepts & Applications",
    category: "2024/2025 Semester II",
  },
  {
    id: 3,
    shortName: "ICT2223",
    name: "Internet of Things",
    category: "2024/2025 Semester II",
  },
  {
    id: 4,
    shortName: "ICT2232",
    name: "Software Engineering",
    category: "2024/2025 Semester II",
  },
  {
    id: 5,
    shortName: "ICT2242",
    name: "Management Information Systems",
    category: "2024/2025 Semester II",
  },
  {
    id: 6,
    shortName: "ICT2252",
    name: "Wireless Communications",
    category: "2024/2025 Semester II",
  },
  {
    id: 7,
    shortName: "TCS2212",
    name: "Accounting for Technologists",
    category: "2024/2025 Semester II",
  },
  {
    id: 8,
    shortName: "TMS2213_ICT",
    name: "Probability and Statistics",
    category: "2024/2025 Semester II",
  },
];

const Home = () => {
  const navigate = useNavigate();

  const { user, logout } = useAuth();
const [profileMenuOpen, setProfileMenuOpen] = useState(false);
const [courseModalOpen, setCourseModalOpen] = useState(false);
const [courseSearch, setCourseSearch] = useState("");

const [activeFilter, setActiveFilter] = useState("All");
const [notices, setNotices] = useState([]);
const [loadingNotices, setLoadingNotices] = useState(true);
const [noticeError, setNoticeError] = useState("");

useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setCourseModalOpen(false);
    }
  };
  if (courseModalOpen) {
    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "unset";
  }
  return () => {
    window.removeEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "unset";
  };
}, [courseModalOpen]);

const filteredCourses = COURSES.filter((course) => {
  const query = courseSearch.toLowerCase();
  return (
    course.shortName.toLowerCase().includes(query) ||
    course.name.toLowerCase().includes(query) ||
    course.category.toLowerCase().includes(query)
  );
});

useEffect(() => {
  const fetchNotices = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/notices");

      if (!response.ok) {
        throw new Error("Failed to load notices");
      }

      const data = await response.json();
      setNotices(data.notices || []);
    } catch (error) {
      setNoticeError("Unable to load notices. Please try again later.");
    } finally {
      setLoadingNotices(false);
    }
  };

  fetchNotices();
}, []);

const filteredNotices =
  activeFilter === "All"
    ? notices
    : notices.filter(
        (notice) =>
          notice.category.toLowerCase() === activeFilter.toLowerCase()
      );

const latestNotices = filteredNotices.slice(0, 5);

const getNoticeTagClass = (category) => {
  const classes = {
    general: "tag-general",
    ca: "tag-academic",
    exam: "tag-exam",
    academic: "tag-academic",
    event: "tag-event",
  };

  return classes[category?.toLowerCase()] || "tag-general";
};

const formatNoticeDate = (date) => {
  return new Date(date).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

  return (
    <div className="home-layout">
      {/* Top Navbar */}
      <nav className="home-navbar">
        <div className="home-brand" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
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

        {/* Top-right Login & Register buttons as per sketch */}
        
<div className="navbar-actions">
  {!user ? (
    <>
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
    </>
  ) : (
    <div className="profile-menu-container">
      <button
        type="button"
        className="profile-icon-btn"
        aria-label="Open profile menu"
        aria-expanded={profileMenuOpen}
        onClick={() => setProfileMenuOpen(!profileMenuOpen)}
      >
        <UserCircle size={27} />
        <span>{user.name}</span>
      </button>

      {profileMenuOpen && (
        <div className="profile-dropdown">
          <p className="profile-user-name">{user.name}</p>
          <p className="profile-user-role">
            {user.role === "admin" ? "Administrator" : "Student"}
          </p>

          <button
  type="button"
  onClick={() => {
    if (user.role === "admin") {
      navigate("/admin-dashboard");
    } else {
      navigate("/user-dashboard");
    }
  }}
>
  Dashboard
</button>

          <button
            type="button"
            onClick={async () => {
              try {
                await logout();
                setProfileMenuOpen(false);
                navigate("/");
              } catch (error) {
                console.error("Logout failed:", error);
              }
            }}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      )}
    </div>
  )}
</div>

      </nav>

      {/* Main Content Area */}
      <main className="home-main">
        {/* Intro banner */}
        <section className="home-intro">
          <div>
            <div className="intro-badge">
              <Sparkles size={13} />
              Academic Portal 2026
            </div>
            <h2 className="intro-title">
              Welcome to <span>AcadHub</span>
            </h2>
            <p className="intro-desc">
              Your centralized gateway for courses, collaboration, schedules, and instant academic notices.
            </p>
          </div>

          <div className="intro-stats">
            <div className="stat-pill">
              <span className="pulse-dot"></span>
              <span>Semester Fall 2026 Active</span>
            </div>
          </div>
        </section>

        {/* Content Layout: 8 Cards (Left) + Notices (Right) */}
        <div className="home-content-layout">
          {/* Left Grid: 8 Cards (2 rows of 4) */}
          <section className="cards-section" aria-label="Academic Portals">
            <div className="cards-grid">
              {PORTAL_CARDS.map((card) => {
                const IconComponent = card.icon;
                const isCourseCard = card.id === "courses";
                return (
                  <div
                    key={card.id}
                    className={`portal-card ${isCourseCard ? "portal-card-courses" : ""}`}
                    onClick={() => {
                      if (isCourseCard) {
                        setCourseModalOpen(true);
                      } else {
                        navigate(card.path);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        if (isCourseCard) {
                          setCourseModalOpen(true);
                        } else {
                          navigate(card.path);
                        }
                      }
                    }}
                  >
                    <div>
                      <div className="card-top">
                        <div className="card-icon-box">
                          <IconComponent size={22} />
                        </div>
                        <ChevronRight size={18} className="card-arrow" />
                      </div>

                      <div className="card-content">
                        <h3 className="card-title">{card.title}</h3>
                        <p className="card-description">{card.description}</p>
                        {isCourseCard && (
                          <div className="card-course-preview">
                            <span className="course-pill-mini">ENG2222</span>
                            <span className="course-pill-mini">ICT2213</span>
                            <span className="course-pill-mini">ICT2223</span>
                            <span className="course-pill-mini more">+{COURSES.length - 3}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="card-meta">
                      <span className="card-badge">{card.badge}</span>
                      <span>{isCourseCard ? "View Catalog" : "Access Portal"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Right Column: Notices Board */}
          <aside className="notices-sidebar" aria-label="Academic Notices">
            <header className="notices-header">
              <div className="notices-title-group">
                <div className="notices-icon-badge">
                  <Bell size={18} />
                </div>
                <h3 className="notices-heading">Notices</h3>
              </div>
              <span className="notices-count-badge">
                {notices.length} Total
              </span>
            </header>

            {/* Filter tags */}
            <div className="notices-filter-bar">
            {["All", "General", "CA", "Exam", "Academic", "Event"].map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={`filter-tab ${activeFilter === filter ? "active" : ""}`}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Notices List */}
            <div className="notices-list">
  {loadingNotices ? (
    <p>Loading notices...</p>
  ) : noticeError ? (
    <p>{noticeError}</p>
  ) : latestNotices.length === 0 ? (
    <p>No notices available in this category.</p>
  ) : (
    latestNotices.map((notice) => (
      <article key={notice._id} className="notice-item">
        <div className="notice-top-meta">
          <span
            className={`notice-tag ${getNoticeTagClass(notice.category)}`}
          >
            {notice.category.toUpperCase()}
          </span>

          <span className="notice-date">
            <Clock size={12} />
            {formatNoticeDate(notice.createdAt)}
          </span>
        </div>

        <h4 className="notice-item-title">{notice.title}</h4>

        <p className="notice-item-snippet">{notice.content}</p>
      </article>
    ))
  )}
</div>

            <footer className="notices-footer">
              <button
                type="button"
                className="view-all-notices-btn"
               onClick={() => navigate("/notices")}
              >
                View all announcements
                <ExternalLink size={13} />
              </button>
            </footer>
          </aside>
        </div>
      </main>

      {/* Course Catalog Modal (accessed from Course Catalog Card) */}
      {courseModalOpen && (
        <div
          className="course-modal-backdrop"
          onClick={() => setCourseModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Course Catalog Modal"
        >
          <div
            className="course-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="course-modal-header">
              <div className="course-catalog-title-group">
                <div className="course-catalog-icon-badge">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="course-catalog-heading">Course Catalog</h3>
                  <p className="course-catalog-subheading">
                    2024/2025 Semester II — Enrolled Academic Modules
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="course-modal-close-btn"
                aria-label="Close modal"
                onClick={() => setCourseModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="course-modal-toolbar">
              <div className="course-search-box">
                <Search size={16} className="course-search-icon" />
                <input
                  type="text"
                  className="course-search-input"
                  placeholder="Search by module code or name (e.g. ICT, English)..."
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  autoFocus
                />
                {courseSearch && (
                  <button
                    type="button"
                    className="course-search-clear"
                    onClick={() => setCourseSearch("")}
                  >
                    Clear
                  </button>
                )}
              </div>
              <span className="course-catalog-count-badge">
                {filteredCourses.length} {filteredCourses.length === 1 ? "Course" : "Courses"}
              </span>
            </div>

            <div className="course-modal-content">
              {filteredCourses.length === 0 ? (
                <div className="course-modal-empty">
                  <p>No modules found matching "{courseSearch}".</p>
                  <button
                    type="button"
                    className="modal-reset-btn"
                    onClick={() => setCourseSearch("")}
                  >
                    Reset Search
                  </button>
                </div>
              ) : (
                <div className="course-catalog-grid">
                  {filteredCourses.map((course) => (
                    <div
                      key={course.id}
                      className="course-card"
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setCourseModalOpen(false);
                        navigate("/login");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setCourseModalOpen(false);
                          navigate("/login");
                        }
                      }}
                    >
                      <div className="course-card-top">
                        <span className="course-code-badge">
                          <Hash size={11} />
                          {course.shortName}
                        </span>
                        <ChevronRight size={16} className="course-card-arrow" />
                      </div>
                      <h4 className="course-card-name">{course.name}</h4>
                      <div className="course-card-footer">
                        <Tag size={11} />
                        <span>{course.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="course-modal-footer">
              <span className="modal-footer-hint">
                Select any module to sign in and view syllabus, materials, and discussions.
              </span>
              <div className="modal-footer-actions">
                <button
                  type="button"
                  className="modal-btn-close"
                  onClick={() => setCourseModalOpen(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="modal-btn-signin"
                  onClick={() => {
                    setCourseModalOpen(false);
                    navigate("/login");
                  }}
                >
                  Student Sign In
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
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

export default Home;
