import React, { useState } from 'react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Logging in:', { email, password });
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat relative font-sans"
      style={{
  backgroundImage: `url('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2070&auto=format&fit=crop')`
}}


    >
      {/* Background Dark Overlay  */}
      <div className="absolute inset-0 bg-[#060814]/80 backdrop-blur-[2px]"></div>

      {/* ===================== CENTER LOGIN CARD ===================== */}
      <div className="relative z-10 w-full max-w-[460px] bg-[#0c101d]/90 border border-slate-700/60 rounded-3xl p-8 sm:p-10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] backdrop-blur-xl">
        
        {/* Logo & AcadHub Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 p-0.5 shadow-xl shadow-indigo-600/30 mb-3">
            <div className="w-full h-full bg-[#0a0e1a] rounded-2xl flex items-center justify-center">
              <svg className="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
            Acad<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-500">Hub</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Centralized Academic Collaboration Workspace
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Institutional Email */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Registration No / Institutional Email
            </label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. tg2092 or name@university.ac.lk"
              className="w-full px-4 py-3 bg-[#080c16]/90 border border-slate-700/80 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Password
              </label>
              <a href="#" className="text-xs text-indigo-400 hover:text-indigo-300 transition">
                Lost password?
              </a>
            </div>
            
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 bg-[#080c16]/90 border border-slate-700/80 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200 cursor-pointer font-medium"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Remember Checkbox */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs text-slate-400">Remember this device</span>
            </label>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:brightness-110 text-white font-semibold rounded-xl text-sm shadow-xl shadow-indigo-600/30 transition duration-200 cursor-pointer flex items-center justify-center gap-2 group mt-2"
          >
            <span>Log In</span>
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-8 pt-5 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-400">
            Don't have an account yet?{' '}
            <a href="#" className="text-indigo-400 hover:text-indigo-300 font-semibold ml-1 transition">
              Create an account
            </a>
          </p>
        </div>

      </div>

      {/* Bottom Footer Notice */}
      <div className="absolute bottom-4 text-center text-xs text-slate-400/80 z-10">
        © {new Date().getFullYear()} AcadHub • Academic Management System
      </div>

    </div>
  );
}
