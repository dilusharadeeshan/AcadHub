import { useState } from 'react';


const Login = () => {
  // States for Email, Password, and Error Messages
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Function executed when the form is submitted
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation to check for empty fields
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setError('');
    
    // This is where you will connect your Backend API later
    console.log('Logging in with:', { email, password });
    alert('Login successful! (Ready to send data to backend)');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
        
        {/* Heading */}
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-800">Welcome Back!</h2>
          <p className="text-sm text-gray-500 mt-2">Log in to your account to continue learning</p>
        </div>

        {/* Error Message Alert */}
        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg text-center border border-red-200">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="example@mail.com"
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="••••••••"
            />
          </div>

          {/* Remember Me & Forgot Password Links */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center text-gray-600">
              <input type="checkbox" className="rounded text-blue-500 mr-2" />
              Remember me
            </label>
            <a href="#" className="text-blue-600 hover:underline">Forgot password?</a>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
          >
            Log In
          </button>
        </form>

        {/* Register/Sign Up Link */}
        <div className="text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <a href="#" className="text-blue-600 font-medium hover:underline">
            Register here
          </a>
        </div>

      </div>
    </div>
  );
};

export default Login;
