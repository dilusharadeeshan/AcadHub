import { lazy, Suspense, useEffect } from 'react';
import {
  BrowserRouter,
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { useAuth } from './hooks/useAuth';
import { Empty, FormError, Loading } from './components/UI';
import Layout from './components/Layout';
import { AuthPage, PendingPage } from './pages/AuthPages';
import { staff } from './lib/api';
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Resources = lazy(() => import('./pages/Resources'));
const ResourceForm = lazy(() => import('./pages/ResourceForm'));
const ResourceDetail = lazy(() => import('./pages/ResourceDetail'));
const Questions = lazy(() => import('./pages/Questions'));
const QuestionForm = lazy(() => import('./pages/QuestionForm'));
const QuestionDetail = lazy(() => import('./pages/QuestionDetail'));
const Profile = lazy(() => import('./pages/Profile'));
const Subjects = lazy(() => import('./pages/Subjects'));
const Admin = lazy(() => import('./pages/Admin'));
const Guidelines = lazy(() => import('./pages/Guidelines'));

function Protected({ active = true, moderator = false }) {
  const { user, loading, error } = useAuth(),
    location = useLocation();
  if (loading) return <Loading />;
  if (!user && error && error.status !== 401)
    return (
      <div className="center-page">
        <div className="panel">
          <h1>We couldn’t open your workspace.</h1>
          <FormError error={error} />
          <button className="btn" onClick={() => window.location.reload()}>
            Try again
          </button>
          <Link className="btn secondary" to="/login">
            Go to sign in
          </Link>
        </div>
      </div>
    );
  if (!user)
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  if (active && user.status === 'pending') return <Navigate to="/pending" replace />;
  if (moderator && !staff(user))
    return (
      <Empty
        title="Permission denied"
        description="This workspace is reserved for moderators and administrators."
        action={
          <Link className="btn" to="/dashboard">
            Back to overview
          </Link>
        }
      />
    );
  return <Outlet />;
}
function ScrollAndTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title =
      'AcadHub · ' +
      (pathname.split('/')[1] || 'Your learning community').replace(/^./, (v) => v.toUpperCase());
  }, [pathname]);
  return null;
}
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <ScrollAndTitle />
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/login" element={<AuthPage key="login" />} />
              <Route path="/register" element={<AuthPage key="register" register />} />
              <Route path="/guidelines" element={<Guidelines />} />
              <Route element={<Protected active={false} />}>
                <Route path="/pending" element={<PendingPage />} />
                <Route element={<ProfileLayout />}>
                  <Route path="/profile" element={<Profile />} />
                </Route>
              </Route>
              <Route element={<Protected />}>
                <Route element={<Layout />}>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/resources" element={<Resources />} />
                  <Route path="/contributions" element={<Resources mine />} />
                  <Route path="/resources/new" element={<ResourceForm />} />
                  <Route path="/resources/:id" element={<ResourceDetail />} />
                  <Route path="/resources/:id/edit" element={<ResourceForm />} />
                  <Route path="/questions" element={<Questions />} />
                  <Route path="/questions/new" element={<QuestionForm />} />
                  <Route path="/questions/:id" element={<QuestionDetail />} />
                  <Route path="/questions/:id/edit" element={<QuestionForm />} />
                  <Route path="/subjects" element={<Subjects />} />
                  <Route element={<Protected moderator />}>
                    <Route path="/admin" element={<Admin />} />
                  </Route>
                </Route>
              </Route>
              <Route
                path="*"
                element={
                  <div className="center-page">
                    <Empty
                      title="This page isn’t in the syllabus."
                      description="The link may be outdated, or the page may have moved."
                      action={
                        <Link className="btn" to="/">
                          Go to your workspace
                        </Link>
                      }
                    />
                  </div>
                }
              />
            </Routes>
          </Suspense>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
function ProfileLayout() {
  const { user } = useAuth();
  return user.status === 'pending' ? <Outlet /> : <Layout />;
}
