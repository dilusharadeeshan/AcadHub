import { useState } from "react";
import { GraduationCap, ArrowRight } from "lucide-react";
import "./Auth.css";

const Login = () => {
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
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed.");
        return;
      }

      alert(data.message);
    } catch (error) {
      setError("Something went wrong. Please try again.");
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
              <GraduationCap size={27} />
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
                Email address
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
            <div className="password-field">
              <div className="field">
                <label htmlFor="password">
                  Password
                </label>

                <input
                  id="password"
                  name="password"
                  type={visible ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="button"
                className="password-toggle"
                onClick={() => setVisible(!visible)}
              >
                {visible ? "Hide" : "Show"}
              </button>
            </div>

            {/* Remember me */}
            <div className="form-options">
              <label className="checkbox-label">
                <input type="checkbox" />
                <span>Keep me signed in</span>
              </label>
            </div>

            {/* Login button */}
            <button
              type="submit"
              className="full-width"
              disabled={busy}
            >
              {busy ? "Signing in..." : "Sign in"}
              
              {!busy && <ArrowRight size={17} />}
            </button>
          </form>

          {/* Register */}
          <p className="auth-switch">
            Don't have an account yet?{" "}
            <a href="#">
              Create an account
            </a>
          </p>

        </div>
      </main>

      {/* Footer */}
      <footer className="auth-copyright">
        © {new Date().getFullYear()} AcadHub · Academic Management System
      </footer>
    </div>
  );
};

export default Login;