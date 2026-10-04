import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, ArrowRight } from "lucide-react";
import "./Auth.css";

const Register = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
         setError("Passwords do not match.");
      return;
    }
      setError("");

    try {
    const response = await fetch(
      "http://localhost:5000/api/auth/register",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setError(data.message || "Registration failed.");
      return;
    }

    navigate("/login");
  } catch (error) {
   setError("Something went wrong. Please try again.");
  }

  };

  return (
    <div className="auth-layout">
      <main className="auth-main">
        <div className="auth-form">
          <header className="auth-heading">
            <div className="auth-logo" aria-label="AcadHub">
              <GraduationCap size={27} />
            </div>

            <h1 className="brand-word">
              Acad<span>Hub</span>
            </h1>

            <p>Centralized Academic Collaboration Workspace</p>

            <h2>Create your account</h2>
          </header>

          <form onSubmit={handleSubmit}>
            {error && (
  <div className="form-error">
    {error}
  </div>
)}

            <div className="field">
              <label htmlFor="name">Full name</label>

              <input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="email">Email address</label>

              <input
                id="email"
                type="email"
                placeholder="name@university.ac.lk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>

              <input
                id="password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="confirmPassword">
                Confirm password
              </label>

              <input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="full-width">
              Create account
              <ArrowRight size={17} />
            </button>
          </form>

          <p className="auth-switch">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
            >
              Sign in
            </button>
          </p>
        </div>
      </main>

      <footer className="auth-copyright">
        © {new Date().getFullYear()} AcadHub · Academic Management System
      </footer>
    </div>
  );
};

export default Register;