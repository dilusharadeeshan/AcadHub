import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Search,
  Sparkles,
  Layers,
  Tag,
  Hash,
  UserCircle,
  LogOut,
  ExternalLink,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "../home/Home.css";
import "./CourseCatalog.css";

export const COURSES = [
  {
    id: 1,
    shortName: "ENG2222",
    name: "English IV",
    category: "2024/2025 Semester II",
    department: "Languages & Communication",
    credits: 2,
    type: "Compulsory",
    description: "Advanced academic communication, technical documentation, professional presentation skills, and research reporting for technologists.",
  },
  {
    id: 2,
    shortName: "ICT2213",
    name: "Operating System Concepts & Applications",
    category: "2024/2025 Semester II",
    department: "Computer Technology",
    credits: 3,
    type: "Core",
    description: "Process management, memory paging, file systems, synchronization primitives, shell scripting, and hands-on Linux administration.",
  },
  {
    id: 3,
    shortName: "ICT2223",
    name: "Internet of Things",
    category: "2024/2025 Semester II",
    department: "Computer Technology",
    credits: 3,
    type: "Core",
    description: "Embedded microcontroller programming, sensor interfacing, IoT protocols (MQTT, HTTP), edge computing, and telemetry dashboards.",
  },
  {
    id: 4,
    shortName: "ICT2232",
    name: "Software Engineering",
    category: "2024/2025 Semester II",
    department: "Software Systems",
    credits: 2,
    type: "Core",
    description: "Agile methodologies, software architectural patterns, UML modeling, testing strategies, CI/CD pipelines, and project lifecycle management.",
  },
  {
    id: 5,
    shortName: "ICT2242",
    name: "Management Information Systems",
    category: "2024/2025 Semester II",
    department: "Information Systems",
    credits: 2,
    type: "Core",
    description: "Strategic information systems, enterprise resource planning (ERP), decision support systems, data governance, and organizational transformation.",
  },
  {
    id: 6,
    shortName: "ICT2252",
    name: "Wireless Communications",
    category: "2024/2025 Semester II",
    department: "Networking & Telecommunications",
    credits: 2,
    type: "Core",
    description: "Electromagnetic wave propagation, cellular network topologies, 4G/5G mobile standards, modulation schemes, and wireless security protocols.",
  },
  {
    id: 7,
    shortName: "TCS2212",
    name: "Accounting for Technologists",
    category: "2024/2025 Semester II",
    department: "Management & Finance",
    credits: 2,
    type: "Interdisciplinary",
    description: "Financial accounting principles, balance sheet analysis, cash flow management, cost allocation, techno-economic feasibility, and project budgeting.",
  },
  {
    id: 8,
    shortName: "TMS2213_ICT",
    name: "Probability and Statistics",
    category: "2024/2025 Semester II",
    department: "Mathematics & Statistics",
    credits: 3,
    type: "Foundation",
    description: "Random variables, probability distributions, hypothesis testing, linear regression analysis, sampling methods, and inferential data modeling.",
  },
];

const CATEGORY_TABS = ["All", "ICT / Tech", "Mathematics", "Management", "Languages"];

const CourseCatalog = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");

  const totalCredits = useMemo(() => {
    return COURSES.reduce((sum, c) => sum + (c.credits || 0), 0);
  }, []);

  const filteredCourses = useMemo(() => {
    const term = search.trim().toLowerCase();

    return COURSES.filter((course) => {
      const matchesSearch =
        !term ||
        course.shortName.toLowerCase().includes(term) ||
        course.name.toLowerCase().includes(term) ||
        course.category.toLowerCase().includes(term) ||
        course.department.toLowerCase().includes(term);

      let matchesTab = true;
      if (activeTab === "ICT / Tech") {
        matchesTab = course.shortName.startsWith("ICT");
      } else if (activeTab === "Mathematics") {
        matchesTab = course.shortName.startsWith("TMS");
      } else if (activeTab === "Management") {
        matchesTab = course.shortName.startsWith("TCS") || course.shortName.includes("2242");
      } else if (activeTab === "Languages") {
        matchesTab = course.shortName.startsWith("ENG");
      }

      return matchesSearch && matchesTab;
    });
  }, [search, activeTab]);

  const handleAccessModule = (course) => {
    if (!user) {
      navigate("/login");
    } else if (user.role === "admin") {
      navigate("/admin-dashboard");
    } else {
      navigate("/user-dashboard");
    }
  };

  return (
    <div className="home-layout catalog-layout">
      {/* Top Navbar */}
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
        {/* Header Section */}
        <section className="catalog-header-section">
          <div>
            <button
              type="button"
              className="back-link"
              onClick={() => navigate("/")}
            >
              <ArrowLeft size={14} />
              Back to portal home
            </button>

            <div className="intro-badge">
              <Sparkles size={13} />
              Academic Semester Modules
            </div>

            <h2 className="intro-title">
              Course <span>Catalog</span>
            </h2>
            <p className="intro-desc">
              Browse current semester lecture syllabi, credit allocations, and academic curriculum modules.
            </p>
          </div>

          <div className="catalog-header-actions">
            <div className="catalog-stat-card">
              <div className="catalog-stat-icon">
                <BookOpen size={18} />
              </div>
              <div className="catalog-stat-info">
                <span className="catalog-stat-number">{COURSES.length} Courses</span>
                <span className="catalog-stat-label">2024/2025 Semester II</span>
              </div>
            </div>

            <div className="catalog-stat-card">
              <div className="catalog-stat-icon">
                <Layers size={18} />
              </div>
              <div className="catalog-stat-info">
                <span className="catalog-stat-number">{totalCredits} Credits</span>
                <span className="catalog-stat-label">Total Workload</span>
              </div>
            </div>
          </div>
        </section>

        {/* Search & Filter Toolbar */}
        <div className="catalog-toolbar">
          <div className="catalog-filter-bar">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                className={`filter-tab ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="catalog-search-box">
            <Search size={16} />
            <input
              type="text"
              className="catalog-search-input"
              placeholder="Search module code or name (e.g. ICT, English)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="catalog-search-clear"
                onClick={() => setSearch("")}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Course Cards Grid */}
        <div className="catalog-grid">
          {filteredCourses.length === 0 ? (
            <div className="catalog-empty-box">
              <p>No courses match your search criteria "{search}".</p>
              <button
                type="button"
                className="catalog-reset-btn"
                onClick={() => {
                  setSearch("");
                  setActiveTab("All");
                }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredCourses.map((course) => (
              <article key={course.id} className="course-catalog-card">
                <div>
                  <div className="card-header-top">
                    <span className="course-code-pill">
                      <Hash size={11} />
                      {course.shortName}
                    </span>
                    <span className="course-credits-pill">
                      {course.credits} Credits · {course.type}
                    </span>
                  </div>

                  <h3 className="course-title-text">{course.name}</h3>
                  <p className="course-desc-text">{course.description}</p>

                  <div className="course-meta-tags">
                    <span className="meta-chip meta-chip-sem">
                      <Tag size={11} />
                      {course.category}
                    </span>
                    <span className="meta-chip">
                      {course.department}
                    </span>
                  </div>
                </div>

                <div className="course-card-actions">
                  <span className="course-instructor-text">
                    <CheckCircle size={13} style={{ color: "#10b981" }} />
                    Active Enrollment
                  </span>

                  <button
                    type="button"
                    className="btn-access-course"
                    onClick={() => handleAccessModule(course)}
                  >
                    <span>Access Module</span>
                    <ExternalLink size={13} />
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="home-footer">
        <div>© 2026 AcadHub · Academic Management System</div>
        <div className="footer-links">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate("/");
            }}
          >
            Home
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate("/notices");
            }}
          >
            Notices
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate("/login");
            }}
          >
            Sign In
          </a>
        </div>
      </footer>
    </div>
  );
};

export default CourseCatalog;
