// frontend/src/routes/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";


export const getDashboardPath = (role) =>
  role === "admin" ? "/admin-dashboard" : "/user-dashboard";

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  // 1. Still verifying initial login cookie -> Show loading indicator
  if (loading) {
    return <p style={{ padding: "2rem", textAlign: "center" }}>Loading...</p>;
  }

  // 2. Not logged in -> Redirect to login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

 if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  // 4. Authorized -> Render the protected component
  return children;
};