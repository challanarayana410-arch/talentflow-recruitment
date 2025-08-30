import React, { useState } from 'react';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-2">
          <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h1 className="text-4xl font-bold text-white">Talent<span className="text-indigo-400">Flow</span></h1>
        </div>
        <p className="text-indigo-200">AI-Powered Recruitment Platform</p>
      </div>

      {/* Login Card */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-white/20 shadow-2xl">
        <h2 className="text-2xl font-semibold text-white mb-6">Sign in to your account</h2>

        <form className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-indigo-200 mb-2">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="recruiter@company.com"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-indigo-200 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center text-indigo-200">
              <input type="checkbox" className="mr-2 rounded border-white/20 bg-white/10" />
              Remember me
            </label>
            <a href="#" className="text-indigo-400 hover:text-indigo-300">Forgot password?</a>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-indigo-500/30"
          >
            Sign In
          </button>
        </form>

        <div className="mt-6 p-4 bg-indigo-900/50 rounded-lg border border-indigo-500/30">
          <p className="text-indigo-300 text-sm mb-1">Demo credentials:</p>
          <p className="text-white text-sm">Email: recruiter@talentflow.com</p>
          <p className="text-white text-sm">Password: demo123</p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-12 mt-10 text-center">
        <div>
          <div className="text-3xl font-bold text-white">-50%</div>
          <div className="text-indigo-300 text-sm">Time to Hire</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-white">95%</div>
          <div className="text-indigo-300 text-sm">Parse Accuracy</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-white">2.3x</div>
          <div className="text-indigo-300 text-sm">Productivity</div>
        </div>
      </div>

      <p className="mt-8 text-indigo-300 text-sm">AI-Powered Recruitment Analytics</p>
    </div>
  );
}

export default App;
