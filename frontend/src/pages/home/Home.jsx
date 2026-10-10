import { useState } from "react";
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
  ExternalLink
} from "lucide-react";
import "./Home.css";

const PORTAL_CARDS = [
  {
    id: "courses",
    title: "Course Catalog",
    description: "Browse and enroll in academic semester modules, syllabi, and learning guides.",
    icon: BookOpen,
    badge: "Semester 2",
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

const INITIAL_NOTICES = [
  {
    id: 1,
    title: "End-Semester Examination Timetable - Fall 2026",
    category: "Exam",
    tagClass: "tag-exam",
    date: "Today, 10:30 AM",
    snippet: "The final examination schedule for the Faculty of Computing & Engineering is officially published.",
  },
  {
    id: 2,
    title: "Call for Undergraduate Research Abstracts",
    category: "Academic",
    tagClass: "tag-academic",
    date: "Oct 04, 2026",
    snippet: "Submit your final year project abstracts for the Annual AcadHub Research Symposium by Oct 25.",
  },
  {
    id: 3,
    title: "Campus Central Library 24-Hour Study Access",
    category: "General",
    tagClass: "tag-general",
    date: "Oct 02, 2026",
    snippet: "The central library and computer labs will remain open 24/7 throughout the upcoming study and exam weeks.",
  },
  {
    id: 4,
    title: "Elective Module Registration Deadline Extended",
    category: "Academic",
    tagClass: "tag-academic",
    date: "Sep 29, 2026",
    snippet: "Students who have not finalized their elective choices may make portal updates until Friday 5:00 PM.",
  },
  {
    id: 5,
    title: "Guest Seminar: Deep Learning in Modern Software",
    category: "Event",
    tagClass: "tag-event",
    date: "Sep 25, 2026",
    snippet: "Join visiting industry fellows at Auditorium Hall B for an interactive technical session.",
  },
];

const Home = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("All");

  const filteredNotices =
    activeFilter === "All"
      ? INITIAL_NOTICES
      : INITIAL_NOTICES.filter(
          (notice) => notice.category.toLowerCase() === activeFilter.toLowerCase()
        );

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
                return (
                  <div
                    key={card.id}
                    className="portal-card"
                    onClick={() => navigate(card.path)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        navigate(card.path);
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
                      </div>
                    </div>

                    <div className="card-meta">
                      <span className="card-badge">{card.badge}</span>
                      <span>Access Portal</span>
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
                {INITIAL_NOTICES.length} New
              </span>
            </header>

            {/* Filter tags */}
            <div className="notices-filter-bar">
              {["All", "Exam", "Academic", "Event"].map((filter) => (
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

            {/* Notices item list */}
            <div className="notices-list">
              {filteredNotices.map((notice) => (
                <article
                  key={notice.id}
                  className="notice-item"
                  onClick={() => navigate("/login")}
                  role="button"
                  tabIndex={0}
                >
                  <div className="notice-top-meta">
                    <span className={`notice-tag ${notice.tagClass}`}>
                      {notice.category}
                    </span>
                    <span className="notice-date">
                      <Clock size={12} />
                      {notice.date}
                    </span>
                  </div>

                  <h4 className="notice-item-title">{notice.title}</h4>
                  <p className="notice-item-snippet">{notice.snippet}</p>
                </article>
              ))}
            </div>

            <footer className="notices-footer">
              <button
                type="button"
                className="view-all-notices-btn"
                onClick={() => navigate("/login")}
              >
                View all announcements
                <ExternalLink size={13} />
              </button>
            </footer>
          </aside>
        </div>
      </main>

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
