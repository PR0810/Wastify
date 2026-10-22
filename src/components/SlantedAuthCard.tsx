import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Mail,
  User,
  ArrowLeft,
  AlertCircle,
  Eye,
  EyeOff,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ROLES } from '@/lib/constants';
import type { Profile } from '@/lib/supabase';

interface SlantedAuthCardProps {
  initialMode?: 'signin' | 'signup';
}

export function SlantedAuthCard({ initialMode = 'signin' }: SlantedAuthCardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp } = useAuth();

  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');

  // Keep state synced with route if user navigates back/forward
  useEffect(() => {
    setIsSignUp(location.pathname === '/signup');
  }, [location.pathname]);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Sign up form state
  const [fullName, setFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [role, setRole] = useState<Profile['role']>('citizen');
  const [age, setAge] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);

  // Toggle modes and sync route
  function toggleToSignUp() {
    setIsSignUp(true);
    setLoginError(null);
    window.history.replaceState(null, '', '/signup');
  }

  function toggleToSignIn() {
    setIsSignUp(false);
    setSignupError(null);
    window.history.replaceState(null, '', '/signin');
  }

  // Handle Login
  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setLoginLoading(false);
    if (error) {
      setLoginError(error);
    } else {
      navigate('/app');
    }
  }

  // Handle Sign Up
  async function handleSignUpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSignupError(null);

    if (signupPassword.length < 6) {
      setSignupError('Password must be at least 6 characters long.');
      return;
    }

    const ageNum = role === 'citizen' ? parseInt(age) : undefined;
    if (role === 'citizen' && (!ageNum || ageNum < 1 || ageNum > 120)) {
      setSignupError('Please enter a valid age (1-120).');
      return;
    }

    setSignupLoading(true);
    const { error } = await signUp(signupEmail, signupPassword, fullName, role, ageNum);
    setSignupLoading(false);
    if (error) {
      setSignupError(error);
    } else {
      setIsSignUp(false);
      window.history.replaceState(null, '', '/signin');
      setLoginEmail(signupEmail);
      setLoginPassword(signupPassword);
      setLoginError(null);
      alert('Account created successfully! Click Login to proceed.');
    }
  }

  // Quick Demo credentials auto-fill
  function fillDemo(email: string) {
    setLoginEmail(email);
    setLoginPassword('password123');
    setLoginError(null);
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center bg-slate-900 px-4 py-8 overflow-x-hidden selection:bg-emerald-500 selection:text-white">
      {/* Background ambient subtle glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute -bottom-32 right-1/4 h-96 w-96 rounded-full bg-teal-500/15 blur-3xl" />
      </div>

      {/* Top bar */}
      <div className="relative z-20 w-full max-w-[880px] mb-4 flex items-center justify-between">
        <Link
          to="/"
          className="group inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-800/80 px-4 py-1.5 text-xs font-semibold text-slate-300 backdrop-blur-md transition-all hover:border-emerald-500 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          Back to Home
        </Link>

        {/* Real Official Wastify Logo */}
        <Link to="/" className="inline-block">
          <img
            src="/wastify-logo.png"
            alt="Wastify Logo"
            className="h-8 w-auto object-contain brightness-0 invert opacity-95 transition-opacity hover:opacity-100"
          />
        </Link>
      </div>

      {/* ============================================================ */}
      {/* SLANTED ROTATING CONTAINER                                   */}
      {/* ============================================================ */}
      <div className={`slanted-auth-box ${isSignUp ? 'active' : ''}`}>
        {/* ROTATING SHAPE 1 (Sits on Right for Login) */}
        <div className="curved-shape" />

        {/* ROTATING SHAPE 2 (Rotates to Left for Register) */}
        <div className="curved-shape-2" />

        {/* ------------------------------------------------------------ */}
        {/* LOGIN FORM (Left half on Desktop)                            */}
        {/* ------------------------------------------------------------ */}
        <div className="form-panel login-panel">
          <div className="form-content">
            <div className="mb-5">
              <img
                src="/wastify-logo.png"
                alt="Wastify"
                className="h-8 w-auto object-contain mb-3"
              />
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Login</h2>
              <p className="text-xs text-slate-500 mt-1">Please enter your credentials to login</p>
            </div>

            {loginError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/60 pl-3.5 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="name@example.com"
                  />
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Password
                  </label>
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => alert('Password reset instructions will be sent to your email.')}
                    className="text-[11px] font-semibold text-emerald-700 hover:underline"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/60 pl-3.5 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full rounded-full bg-slate-950 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 mt-2 cursor-pointer"
              >
                {loginLoading ? 'Signing In...' : 'Login'}
              </button>
            </form>

            <p className="mt-5 text-center text-xs text-slate-600">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={toggleToSignUp}
                className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
              >
                Sign Up
              </button>
            </p>

            {/* Quick Demo Accounts Helper */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1.5">
                <Sparkles className="h-3 w-3 text-emerald-600" /> Demo 1-Click
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => fillDemo('citizen@wastify.com')}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 truncate text-left cursor-pointer"
                >
                  Citizen Demo
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo('driver@wastify.com')}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-slate-700 hover:bg-amber-50 hover:text-amber-800 truncate text-left cursor-pointer"
                >
                  Driver Demo
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* LOGIN INFO TEXT (Right half over the dark slanted shape)     */}
        {/* ------------------------------------------------------------ */}
        <div className="info-panel login-info">
          <div className="info-content text-right">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase leading-none">
              Welcome <br />
              <span className="text-emerald-400">Back!</span>
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-[280px] ml-auto">
              To keep connected with your waste management operations, please login with your personal account.
            </p>
          </div>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* REGISTER INFO TEXT (Left half when active)                   */}
        {/* ------------------------------------------------------------ */}
        <div className="info-panel register-info">
          <div className="info-content text-left">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase leading-none">
              Hello, <br />
              <span className="text-emerald-400">Friend!</span>
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-[280px]">
              Enter your personal details and start your journey with Wastify today.
            </p>
          </div>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* REGISTER FORM (Right half when active)                       */}
        {/* ------------------------------------------------------------ */}
        <div className="form-panel register-panel">
          <div className="form-content">
            <div className="mb-4">
              <img
                src="/wastify-logo.png"
                alt="Wastify"
                className="h-7 w-auto object-contain mb-2"
              />
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Registration</h2>
              <p className="text-xs text-slate-500 mt-0.5">Fill in your information to register</p>
            </div>

            {signupError && (
              <div className="mb-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{signupError}</span>
              </div>
            )}

            <form onSubmit={handleSignUpSubmit} className="space-y-3">
              {/* Role Picker Pills */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Choose Role
                </label>
                <div className="grid grid-cols-4 gap-1.5 text-xs">
                  {ROLES.map((r) => {
                    const isSelected = role === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRole(r.id)}
                        className={`rounded-lg border px-1.5 py-1 text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-600 text-white font-bold'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate block text-[11px]">{r.label.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Age field for Citizen */}
              {role === 'citizen' && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800 mb-1">
                    Learner Age
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="1"
                      max="120"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full rounded-xl border border-emerald-300 bg-emerald-50/50 pl-3 pr-10 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none"
                      placeholder="e.g. 15"
                    />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-emerald-600" />
                  </div>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/60 pl-3 pr-10 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none"
                    placeholder="Your full name"
                  />
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/60 pl-3 pr-10 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none"
                    placeholder="name@example.com"
                  />
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showSignupPassword ? 'text' : 'password'}
                    required
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/60 pl-3 pr-10 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none"
                    placeholder="Min 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    {showSignupPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={signupLoading}
                className="w-full rounded-full bg-slate-950 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 mt-1 cursor-pointer"
              >
                {signupLoading ? 'Registering...' : 'Register'}
              </button>
            </form>

            <p className="mt-3.5 text-center text-xs text-slate-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={toggleToSignIn}
                className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Embedded CSS for the Exact Rotating Slanted Shape Mechanism */}
      <style>{`
        /* Container */
        .slanted-auth-box {
          position: relative;
          width: 880px;
          max-width: 100%;
          min-height: 570px;
          background: #ffffff;
          border-radius: 28px;
          box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.5);
          overflow: hidden;
        }

        /* The Rotating Slanted Shapes */
        .curved-shape {
          position: absolute;
          right: -80px;
          top: -120px;
          height: 850px;
          width: 620px;
          background: linear-gradient(135deg, #022c22 0%, #064e3b 45%, #0f172a 100%);
          transform: rotate(10deg) skewY(38deg);
          transform-origin: bottom right;
          transition: transform 1.2s cubic-bezier(0.77, 0, 0.175, 1);
          transition-delay: 0.3s;
          z-index: 10;
        }

        .slanted-auth-box.active .curved-shape {
          transform: rotate(0deg) skewY(0deg) translateY(-120%);
          transition-delay: 0s;
        }

        .curved-shape-2 {
          position: absolute;
          left: -120px;
          bottom: -150px;
          height: 850px;
          width: 620px;
          background: linear-gradient(135deg, #0f172a 0%, #064e3b 55%, #022c22 100%);
          transform: rotate(0deg) skewY(0deg) translateY(120%);
          transform-origin: bottom left;
          transition: transform 1.2s cubic-bezier(0.77, 0, 0.175, 1);
          transition-delay: 0s;
          z-index: 10;
        }

        .slanted-auth-box.active .curved-shape-2 {
          transform: rotate(-10deg) skewY(-38deg) translateY(0);
          transition-delay: 0.3s;
        }

        /* Form Panels */
        .form-panel {
          position: absolute;
          top: 0;
          width: 50%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 32px 40px;
          z-index: 15;
          transition: transform 0.8s cubic-bezier(0.77, 0, 0.175, 1), opacity 0.6s ease;
        }

        .form-panel.login-panel {
          left: 0;
          transform: translateX(0);
          opacity: 1;
          pointer-events: auto;
        }

        .slanted-auth-box.active .form-panel.login-panel {
          transform: translateX(-120%);
          opacity: 0;
          pointer-events: none;
        }

        .form-panel.register-panel {
          right: 0;
          transform: translateX(120%);
          opacity: 0;
          pointer-events: none;
        }

        .slanted-auth-box.active .form-panel.register-panel {
          transform: translateX(0);
          opacity: 1;
          pointer-events: auto;
        }

        /* Info Panels */
        .info-panel {
          position: absolute;
          top: 0;
          width: 50%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 40px;
          z-index: 15;
          transition: transform 0.8s cubic-bezier(0.77, 0, 0.175, 1), opacity 0.6s ease;
        }

        .info-panel.login-info {
          right: 0;
          transform: translateX(0);
          opacity: 1;
        }

        .slanted-auth-box.active .info-panel.login-info {
          transform: translateX(120%);
          opacity: 0;
          pointer-events: none;
        }

        .info-panel.register-info {
          left: 0;
          transform: translateX(-120%);
          opacity: 0;
          pointer-events: none;
        }

        .slanted-auth-box.active .info-panel.register-info {
          transform: translateX(0);
          opacity: 1;
          pointer-events: auto;
        }

        /* Mobile Responsiveness */
        @media (max-width: 768px) {
          .curved-shape, .curved-shape-2, .info-panel {
            display: none !important;
          }
          .slanted-auth-box {
            width: 100%;
            min-height: auto;
            border-radius: 20px;
          }
          .form-panel {
            position: relative;
            width: 100%;
            padding: 24px 20px;
          }
          .form-panel.login-panel {
            display: ${isSignUp ? 'none' : 'flex'} !important;
            transform: none !important;
            opacity: 1 !important;
          }
          .form-panel.register-panel {
            display: ${isSignUp ? 'flex' : 'none'} !important;
            transform: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>
    </div>
  );
}
