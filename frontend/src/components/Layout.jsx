import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  ChevronRight,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  ShieldCheck,
  UploadCloud,
  X,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useMobile } from '../hooks/useMedia';
import { Avatar } from './UI';
import { staff } from '../lib/api';

export default function Layout() {
  const { user, logout } = useAuth(),
    notify = useToast(),
    navigate = useNavigate(),
    location = useLocation();
  const [open, setOpen] = useState(false),
    [search, setSearch] = useState(''),
    mobile = useMobile(),
    sidebarRef = useRef(null);
  useEffect(() => {
    if (!open || !mobile) return;
    const previous = document.activeElement,
      overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusable = () =>
      [...sidebarRef.current.querySelectorAll('a,button')].filter(
        (el) => el.getClientRects().length > 0,
      );
    focusable()[0]?.focus();
    const keydown = (e) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'Tab') {
        const nodes = focusable(),
          first = nodes[0],
          last = nodes.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', keydown);
    return () => {
      document.removeEventListener('keydown', keydown);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [open, mobile]);
  const links = [
    ['/dashboard', 'Overview', LayoutDashboard],
    ['/resources', 'Resource library', BookOpen],
    ['/questions', 'Questions & answers', MessageSquare],
    ['/contributions', 'My contributions', UploadCloud],
    ['/subjects', 'Subjects', GraduationCap],
  ];
  const title =
    links.find(([path]) => location.pathname.startsWith(path))?.[1] ||
    (location.pathname.startsWith('/admin')
      ? 'Moderation'
      : location.pathname === '/profile'
        ? 'Your profile'
        : 'Community guidelines');
  async function signOut() {
    try {
      await logout();
      navigate('/login');
    } catch (e) {
      notify(e.message, 'error');
    }
  }
  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      {open && (
        <button
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        ref={sidebarRef}
        inert={mobile && !open}
        className={'sidebar ' + (open ? 'open' : '')}
        aria-label="Main navigation"
      >
        <Link to="/dashboard" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-mark">
            <GraduationCap size={23} />
          </span>
          <span className="brand-word">
            Acad<span>Hub</span>
          </span>
        </Link>
        <button
          className="icon-btn mobile-close"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
        >
          <X size={22} />
        </button>
        <div className="workspace-label">YOUR LEARNING SPACE</div>
        <nav>
          {links.map(([to, label, Icon]) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) => 'nav-item ' + (isActive ? 'active' : '')}
            >
              <Icon size={19} />
              {label}
            </NavLink>
          ))}
          {staff(user) && (
            <>
              <div className="workspace-label">MANAGEMENT</div>
              <NavLink
                className={({ isActive }) => 'nav-item ' + (isActive ? 'active' : '')}
                to="/admin"
                onClick={() => setOpen(false)}
              >
                <ShieldCheck size={19} />
                Moderation
              </NavLink>
            </>
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="contribute-note">
            <span className="note-spark">✦</span>
            <h3>
              A little sharing.
              <br />A lot of possibility.
            </h3>
            <p>Your notes could make someone’s next exam easier.</p>
            <Link className="btn sidebar-cta" to="/resources/new" onClick={() => setOpen(false)}>
              <UploadCloud size={17} />
              Share a resource
            </Link>
          </div>
          <NavLink className="nav-item" to="/guidelines" onClick={() => setOpen(false)}>
            <FileText size={18} />
            Community guidelines
          </NavLink>
          <button className="nav-item logout" onClick={signOut}>
            <LogOut size={18} />
            Sign out
          </button>
          <div className="sidebar-user">
            <Avatar name={user.name} />
            <div>
              <strong>{user.name}</strong>
              <span>
                {user.role} · {user.batch || 'Your batch'}
              </span>
            </div>
            <Link to="/profile" className="icon-btn" aria-label="Edit profile">
              <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </aside>
      <div className="main-shell" inert={mobile && open}>
        <header className="topbar">
          <div className="topbar-title">
            <button
              className="icon-btn menu-toggle"
              aria-expanded={open}
              aria-label="Open navigation"
              onClick={() => setOpen(!open)}
            >
              <Menu size={22} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={15} />
            <strong>{title}</strong>
          </div>
          <form
            role="search"
            className="topbar-search"
            onSubmit={(e) => {
              e.preventDefault();
              navigate('/resources?search=' + encodeURIComponent(search));
              setSearch('');
            }}
          >
            <Search size={17} />
            <input
              aria-label="Search the resource library"
              placeholder="Find something to learn…"
              value={search}
              maxLength={100}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
          <Link to="/profile" className="profile-link" aria-label="Your profile">
            <Avatar name={user.name} small />
          </Link>
        </header>
        <main id="main" tabIndex="-1">
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>Made for your batch. Built for what’s next.</span>
          <Link to="/guidelines">
            Share responsibly <ChevronRight size={13} />
          </Link>
        </footer>
      </div>
    </div>
  );
}
