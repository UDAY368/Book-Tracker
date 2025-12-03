import React, { useState } from 'react';
import { UserRole, User } from '../types';
import { api } from '../services/api';
import { 
  Loader2, 
  AlertCircle, 
  Shield, 
  User as UserIcon, 
  BookOpen, 
  Truck, 
  Users,
  Lock,
  Mail,
  ArrowRight,
  Clock
} from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  onGoToSignup: () => void;
}

const DEMO_ACCOUNTS = [
  { role: UserRole.SUPER_ADMIN, email: 'admin@pssm.org', label: 'Super Admin', icon: <Shield size={14} /> },
  { role: UserRole.BOOK_DISTRIBUTOR, email: 'distributor@pssm.org', label: 'Distributor', icon: <Truck size={14} /> },
  { role: UserRole.INCHARGE, email: 'incharge@pssm.org', label: 'Staff', icon: <BookOpen size={14} /> },
  { role: UserRole.BOOK_RECEIVER, email: 'receiver@pssm.org', label: 'Book Receiver', icon: <Users size={14} /> },
];

const Login: React.FC<LoginProps> = ({ onLogin, onGoToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.SUPER_ADMIN);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsPending(false);
    setIsLoading(true);

    try {
      const response = await api.login(email, password);
      // For demo: override the mock user's role with the selected demo role
      const userWithRole = { ...response.user, role: selectedRole };
      onLogin(userWithRole);
    } catch (err: any) {
      if (err.code === 403) {
        setIsPending(true);
      } else {
        setError(err.message || 'Failed to login. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCreds = (role: UserRole, demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password');
    setSelectedRole(role);
    setError(null);
    setIsPending(false);
  };

  const handlePendingUserDemo = () => {
    setEmail('pending@pssm.org');
    setPassword('password');
    setSelectedRole(UserRole.VOLUNTEER);
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Panel: Marketing / Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 to-slate-900/90 z-10"></div>
        {/* Abstract Pattern */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-emerald-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

        <div className="relative z-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center font-bold text-xl shadow-lg shadow-emerald-500/30">P</div>
            <span className="text-2xl font-bold tracking-wide">PSSM Connect</span>
          </div>
          
          <h1 className="text-5xl font-extrabold leading-tight mb-6">
            Connecting Donors <br/>
            <span className="text-emerald-400">Transforming Lives</span>
          </h1>
          <p className="text-slate-300 text-lg max-w-md leading-relaxed">
            Manage donation books, track distribution networks, and visualize impact with the Pyramid Spiritual Society Movement's dedicated portal.
          </p>
        </div>

        <div className="relative z-20 space-y-6">
           <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10">
              <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                <BookOpen size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Digital Tracking</h3>
                <p className="text-slate-400 text-sm">Real-time status updates for thousands of donation books across districts.</p>
              </div>
           </div>
           
           <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10">
              <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                <Users size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Community Driven</h3>
                <p className="text-slate-400 text-sm">Empowering volunteers, incharges, and distributors with transparent tools.</p>
              </div>
           </div>
        </div>

        <div className="relative z-20 text-slate-500 text-sm">
          © 2024 Pyramid Spiritual Society Movement. All rights reserved.
        </div>
      </div>

      {/* Right Panel: Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-12 bg-slate-50 lg:bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome Back</h2>
            <p className="mt-2 text-slate-500">Sign in to access your dashboard</p>
          </div>

          {/* Social / Email Verification Placeholder */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <Mail className="h-5 w-5 text-blue-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Please verify your email address to access all features. 
                  <a href="#" className="font-medium underline hover:text-blue-600 ml-1">Resend email</a>
                </p>
              </div>
            </div>
          </div>

          {isPending ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center animate-in fade-in zoom-in duration-300">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 mb-4">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-medium text-amber-900">Access Pending Approval</h3>
              <p className="mt-2 text-sm text-amber-700">
                Your account is currently under review by the administrator. You will be notified via email once your access is approved.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setIsPending(false)}
                  className="text-sm font-medium text-amber-600 hover:text-amber-500"
                >
                  Return to Login
                </button>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="p-4 rounded-md bg-red-50 border border-red-100">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Login Failed</h3>
                      <div className="mt-2 text-sm text-red-700">{error}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                    Email or Phone Number
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="text"
                      autoComplete="email"
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-all"
                      placeholder="user@pssm.org"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400" aria-hidden="true" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-all"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-emerald-600 hover:text-emerald-500">
                    Forgot your password?
                  </a>
                </div>
              </div>

              {/* Mock Role Selector */}
              <div className="p-3 bg-indigo-50 rounded-md border border-indigo-100">
                <label className="block text-xs font-bold text-indigo-700 uppercase mb-2">
                  Demo Role Selector
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border"
                  disabled={isLoading}
                >
                  {Object.values(UserRole).map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-50 lg:bg-white text-slate-500">
                  Or use quick demo
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => fillDemoCreds(acc.role, acc.email)}
                  className="flex items-center justify-center px-3 py-2 text-xs font-medium rounded-md bg-white border border-slate-200 shadow-sm text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
                >
                  <span className="mr-2 text-emerald-600">{acc.icon}</span>
                  {acc.label}
                </button>
              ))}
               <button
                  type="button"
                  onClick={handlePendingUserDemo}
                  className="col-span-2 flex items-center justify-center px-3 py-2 text-xs font-medium rounded-md bg-amber-50 border border-amber-200 shadow-sm text-amber-700 hover:bg-amber-100 transition-all"
                >
                  <Clock size={14} className="mr-2" />
                  Test "Pending Approval" State
                </button>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-slate-600">
            Don't have an account?{' '}
            <button 
              onClick={onGoToSignup} 
              className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;