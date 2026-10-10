// frontend/src/pages/dashboard/Dashboard.jsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Dashboard</h1>

      <h2>Welcome, {user.name}!</h2>

      <p>Email: {user.email}</p>
      <p>Role: <strong>{user.role || "student"}</strong></p>

      {user.role === "admin" && (
        <div style={{ marginTop: "1rem", padding: "1rem", border: "1px solid #ccc", borderRadius: "8px" }}>
          <h3>Admin Controls</h3>
          <p>You have administrative access.</p>
        </div>
      )}

      <div style={{ marginTop: "1.5rem" }}>
        <button onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Dashboard;