import { useState } from "react";

import { useNavigate, Link } from "react-router-dom";
import { GraduationCap, ArrowRight } from "lucide-react";
import "./Auth.css";
import { authService } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
    const { login } = useAuth(); 

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [visible, setVisible] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setError("");
    setBusy(true);

   try {
  await login(email, password); 
  navigate("/dashboard");
} catch (err) {
  setError(err.message || "Login failed.");
} finally {
  setBusy(false);
}
  };

  return (
    <div className="auth-layout">
      <main className="auth-main">
        <div className="auth-form">
          
          {/* Header */}
          <header className="auth-heading">
            <div className="auth-logo" aria-label="AcadHub">
              <GraduationCap size={24} />
            </div>

            <h1 className="brand-word">
              Acad<span>Hub</span>
            </h1>

            <p>Centralized Academic Collaboration Workspace</p>
          </header>

          {/* Login form */}
          <form onSubmit={handleSubmit}>
            
            {error && (
              <div className="form-error">
                {error}
              </div>
            )}

            {/* Email */}
            <div className="field">
              <label htmlFor="email">
                EMAIL ADDRESS *
              </label>

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@university.ac.lk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div className="field">
              <div className="field-header">
                <label htmlFor="password">
                  PASSWORD *
                </label>
                <a href="#" className="forgot-password">
                  Lost password?
                </a>
              </div>

              <div className="password-field">
                <input
                  id="password"
                  name="password"
                  type={visible ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder=""
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setVisible(!visible)}
                >
                  {visible ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="form-options">
              <label className="checkbox-label">
                <input type="checkbox" />
                <span>Keep me signed in for 7 days</span>
              </label>
            </div>

            {/* Login button */}
            <button
              type="submit"
              className="full-width submit-btn"
              disabled={busy}
            >
              {busy ? "Signing in..." : "Sign In"}
              
              {!busy && <ArrowRight size={17} />}
            </button>
          </form>

          {/* Register */}
          <div className="auth-switch">
            Don't have an account yet?{" "}
            <Link to="/register" className="auth-link">
              Create an account
            </Link>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="auth-copyright">
        © 2026 AcadHub · Academic Management System
      </footer>
    </div>
  );
};

export default Login;
