
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, Bell } from 'lucide-react';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  userRole: UserRole;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, userRole, onLogout }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopExpanded, setIsDesktopExpanded] = useState(true);
  const location = useLocation();

  // Helper to determine page title
  const getPageTitle = (path: string) => {
    const p = path.toLowerCase();
    if (p.includes('/dashboard')) return 'Dashboard';
    if (p.includes('/add-distribution')) return 'Add Distribution';
    if (p.includes('/distribution')) return 'Add Print Batch';
    if (p.includes('/collection')) return 'Book Collection';
    if (p.includes('/users')) return 'User Management';
    if (p.includes('/analytics')) return 'Analytics & Reports';
    if (p.includes('/leaderboard')) return 'Leaderboard';
    if (p.includes('/settings')) return 'Settings';
    if (p.includes('/help')) return 'Help & Support';
    return 'PSSM Connect';
  };

  const pageTitle = getPageTitle(location.pathname);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar 
        role={userRole} 
        isMobileOpen={isMobileOpen}
        toggleMobile={() => setIsMobileOpen(!isMobileOpen)}
        isDesktopExpanded={isDesktopExpanded}
        toggleDesktop={() => setIsDesktopExpanded(!isDesktopExpanded)}
        onLogout={onLogout}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden transition-all duration-300">
        {/* Top Header */}
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-slate-200 shadow-sm shrink-0 z-10">
          <div className="flex items-center gap-4">
            {/* Mobile Hamburger - Only visible on small screens */}
            <button
              onClick={() => setIsMobileOpen(true)}
              className="text-slate-500 hover:text-slate-700 lg:hidden focus:outline-none p-1 rounded-md hover:bg-slate-100"
            >
              <Menu size={24} />
            </button>
            
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              {pageTitle}
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
             <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-50">
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 block ring-2 ring-white"></span>
             </button>
             
             <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-slate-700 leading-none">
                     {userRole === UserRole.SUPER_ADMIN ? 'Super Admin' : 'User'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{userRole}</p>
                </div>
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 border border-emerald-300 flex items-center justify-center text-emerald-700 font-bold text-sm shadow-sm">
                   {userRole.charAt(0)}
                </div>
             </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth bg-slate-50/50">
          <div className="max-w-7xl mx-auto animate-in fade-in duration-300">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
