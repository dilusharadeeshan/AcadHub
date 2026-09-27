import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {

    const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const getProfile = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/auth/profile",
          {
            method: "GET",
            credentials: "include",
          }
        );

        const data = await response.json();

        if (!response.ok) {
  if (response.status === 401) {
    navigate("/login");
    return;
  }

  setError(data.message || "Unable to load profile.");
  return;
}

        setUser(data.user);
      } catch (error) {
        setError("Something went wrong. Please try again.");
      }
    };

    getProfile();
  }, []);

  if (error) {
    return <p>{error}</p>;
  }

  if (!user) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <h1>Dashboard</h1>

      <h2>Welcome, {user.name}!</h2>

      <p>Email: {user.email}</p>
    </div>
  );
};

export default Dashboard;