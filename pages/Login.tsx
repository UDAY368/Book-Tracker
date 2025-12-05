
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
  Lock,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  onGoToSignup: () => void;
}

const DEMO_ACCOUNTS = [
  { 
    role: UserRole.SUPER_ADMIN, 
    email: 'admin@pssm.org', 
    label: 'Super Admin', 
    description: 'Complete system control & analytics',
    icon: <Shield size={20} />,
    colorClass: 'text-indigo-600 bg-indigo-50 border-indigo-200'
  },
  { 
    role: UserRole.BOOK_DISTRIBUTOR, 
    email: 'distributor@pssm.org', 
    label: 'Distributor', 
    description: 'Manage print batches & dispatch',
    icon: <Truck size={20} />,
    colorClass: 'text-emerald-600 bg-emerald-50 border-emerald-200'
  },
  { 
    role: UserRole.INCHARGE, 
    email: 'incharge@pssm.org', 
    label: 'Staff / Incharge', 
    description: 'Distribution & donor collection',
    icon: <BookOpen size={20} />,
    colorClass: 'text-amber-600 bg-amber-50 border-amber-200'
  },
];

const Login: React.FC<LoginProps> = ({ onLogin, onGoToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await api.login(email, password);
      // For demo: override the mock user's role if a demo role was selected, otherwise default to what api returns or SUPER_ADMIN
      const roleToUse = selectedRole || response.user.role || UserRole.SUPER_ADMIN;
      const userWithRole = { ...response.user, role: roleToUse };
      onLogin(userWithRole);
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (account: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(account.email);
    setPassword('password');
    setSelectedRole(account.role);
    setError(null);
    setIsLoading(true);

    try {
        // Immediate login
        const response = await api.login(account.email, 'password');
        const roleToUse = account.role || response.user.role || UserRole.SUPER_ADMIN;
        const userWithRole = { ...response.user, role: roleToUse };
        onLogin(userWithRole);
    } catch (err: any) {
        setError(err.message || 'Login failed.');
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex h-screen overflow-hidden">
      {/* Left Panel: Marketing / Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 to-slate-900/90 z-10"></div>
        {/* Abstract Pattern */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-emerald-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

        <div className="relative z-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-xl shadow-lg shadow-emerald-500/30 text-white">P</div>
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
           <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
              <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                <BookOpen size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Digital Tracking</h3>
                <p className="text-slate-400 text-sm">Real-time status updates for thousands of donation books across districts.</p>
              </div>
           </div>
           
           <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
              <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                <Shield size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Secure Management</h3>
                <p className="text-slate-400 text-sm">Role-based access control for volunteers, incharges, and distributors.</p>
              </div>
           </div>
        </div>

        <div className="relative z-20 text-slate-500 text-sm flex justify-between items-center w-full">
          <span>© 2024 Pyramid Spiritual Society Movement</span>
          <span className="opacity-50">v2.0.1</span>
        </div>
      </div>

      {/* Right Panel: Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-white relative overflow-y-auto">
        <div className="w-full max-w-md space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sign In</h2>
            <p className="mt-1 text-sm text-slate-500">Click a role to sign in immediately.</p>
          </div>

          {/* Quick Role Selectors */}
          <div className="grid gap-2">
            {DEMO_ACCOUNTS.map((acc) => {
              const isSelected = selectedRole === acc.role;
              return (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleDemoLogin(acc)}
                  disabled={isLoading}
                  className={`relative flex items-center p-3 rounded-xl border-2 transition-all duration-200 text-left group
                    ${isSelected 
                      ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600 shadow-md' 
                      : 'border-slate-100 hover:border-indigo-300 hover:bg-slate-50'
                    }
                    ${isLoading ? 'opacity-50 cursor-wait' : ''}
                  `}
                >
                  <div className={`p-2 rounded-lg mr-3 transition-colors ${isSelected ? 'bg-white shadow-sm ' + acc.colorClass.split(' ')[0] : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:shadow-sm'}`}>
                    {acc.icon}
                  </div>
                  <div className="flex-1">
                    <p className={`font-bold text-sm ${isSelected ? 'text-indigo-900' : 'text-slate-900'}`}>{acc.label}</p>
                    <p className={`text-[10px] ${isSelected ? 'text-indigo-600' : 'text-slate-500'}`}>{acc.description}</p>
                  </div>
                  {isLoading && isSelected && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Loader2 className="animate-spin text-indigo-600" size={20} />
                    </div>
                  )}
                  {!isLoading && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-indigo-600 transition-colors">
                          <ArrowRight size={16} />
                      </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-2 bg-white text-slate-400 font-medium">Or manually</span>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-xs font-bold text-red-800">Login Failed</p>
                  <p className="text-xs text-red-600 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label htmlFor="email" className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="text"
                    required
                    className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white text-sm"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setSelectedRole(null); }}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-bold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white text-sm"
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
                  className="h-3 w-3 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs text-slate-600 cursor-pointer">
                  Remember me
                </label>
              </div>

              <div className="text-xs">
                <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline">
                  Forgot password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-600 pt-2">
            Don't have an account?{' '}
            <button 
              onClick={onGoToSignup} 
              className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors hover:underline"
            >
              Create Account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
