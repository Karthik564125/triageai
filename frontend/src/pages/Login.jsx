import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Zap, 
  Bot, 
  ArrowRight,
  User,
  Lock
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const result = await login(username, password);
      setIsLoading(false);

      if (result.success) {
        toast.success(`Welcome back, ${result.user.name}!`);
        if (result.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/user');
        }
      } else {
        setErrorMessage(result.error || 'Invalid username or password');
        toast.error('Authentication failed');
      }
    } catch (error) {
      setIsLoading(false);
      setErrorMessage('Invalid username or password');
      toast.error('Authentication failed');
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* LEFT SIDE: Product Branding & Description */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-12 flex-col justify-between overflow-hidden border-r border-slate-800">
        {/* Glow Spheres */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-900/50">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">TriageAI</h1>
            <p className="text-xs text-indigo-300 font-medium tracking-wide uppercase">AI-Assisted Support Ticket Management</p>
          </div>
        </div>

        {/* Hero Copy & Concept Description */}
        <div className="relative z-10 my-auto space-y-8 max-w-lg">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-indigo-400" /> Support Ticket Management System
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
              Intelligent Ticket Triage &amp; Assignment
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              TriageAI analyzes support tickets to provide suggestions for summary, category, priority, reason, team recommendation, and customer response draft—reserving final decisions for administrators.
            </p>
          </div>

          {/* Core Principles Grid */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-xs space-y-1.5">
              <Bot className="w-5 h-5 text-indigo-400" />
              <h4 className="text-xs font-bold text-white">AI = Suggestion</h4>
              <p className="text-[11px] text-slate-400">Automated classification drafts and recommendations.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-xs space-y-1.5">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <h4 className="text-xs font-bold text-white">Admin = Final Decision</h4>
              <p className="text-[11px] text-slate-400">Human review and authority before ticket assignment.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-slate-500 border-t border-slate-800/80 pt-4">
          <span>© TriageAI System</span>
        </div>
      </div>

      {/* RIGHT SIDE: Login Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-slate-900">
        <div className="w-full max-w-md space-y-8">
          
          {/* Mobile Header */}
          <div className="text-center space-y-2">
            <div className="lg:hidden inline-flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white">TriageAI</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Sign in to TriageAI</h2>
            <p className="text-xs text-slate-400">
              Access Support User workspace or Administrator console
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-red-950/80 border border-red-800/80 rounded-xl text-red-200 text-xs text-center font-medium">
              {errorMessage}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Field */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="Enter your username (e.g. karthik or admin)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Remember me</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-900/40 transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              {isLoading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};
