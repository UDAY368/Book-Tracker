import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  BarChart3, 
  LogOut, 
  X,
  Trophy,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  Settings,
  HelpCircle,
  Edit,
  FileText,
  UserPlus
} from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  role: UserRole;
  isMobileOpen: boolean;
  toggleMobile: () => void;
  isDesktopExpanded: boolean;
  toggleDesktop: () => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  role, 
  isMobileOpen, 
  toggleMobile, 
  isDesktopExpanded, 
  toggleDesktop, 
  onLogout 
}) => {
  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: [UserRole.SUPER_ADMIN, UserRole.BOOK_DISTRIBUTOR, UserRole.INCHARGE, UserRole.BOOK_RECEIVER, UserRole.VOLUNTEER] },
    // Renamed 'Quick Update' to 'Book Submit'
    { to: '/book-update', label: 'Book Submit', icon: <Edit size={20} />, roles: [UserRole.BOOK_RECEIVER] },
    // Added 'Donor Submit'
    { to: '/donor-submit', label: 'Donor Submit', icon: <UserPlus size={20} />, roles: [UserRole.BOOK_RECEIVER] },
    { to: '/book-register', label: 'Book Register', icon: <FileText size={20} />, roles: [UserRole.INCHARGE] },
    { to: '/distribution', label: 'Distribution', icon: <BookOpen size={20} />, roles: [UserRole.SUPER_ADMIN, UserRole.BOOK_DISTRIBUTOR, UserRole.STAFF] },
    { to: '/collection', label: 'Collection', icon: <UploadCloud size={20} />, roles: [UserRole.STAFF] },
    { to: '/users', label: 'User Mgmt', icon: <Users size={20} />, roles: [UserRole.SUPER_ADMIN] },
    { to: '/analytics', label: 'Analytics', icon: <BarChart3 size={20} />, roles: [] }, 
    { to: '/leaderboard', label: 'Leaderboard', icon: <Trophy size={20} />, roles: [UserRole.SUPER_ADMIN] },
  ];

  const bottomLinks = [
    { to: '/settings', label: 'Settings', icon: <Settings size={20} /> },
    { to: '/help', label: 'Help & Support', icon: <HelpCircle size={20} /> },
  ];

  const filteredLinks = links.filter(link => link.roles.includes(role));

  // Mock pending approvals count for Super Admin
  const pendingApprovals = 3;

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 z-20 bg-black/50 transition-opacity lg:hidden ${isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={toggleMobile}
      />

      {/* Sidebar Container */}
      <div 
        className={`
          fixed inset-y-0 left-0 z-30 bg-slate-900 text-white transition-all duration-300 ease-in-out flex flex-col shadow-xl
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} 
          lg:translate-x-0 lg:static
          ${isDesktopExpanded ? 'lg:w-64' : 'lg:w-20'}
          w-64
        `}
      >
        {/* Header */}
        <div className={`flex items-center h-16 px-4 bg-slate-950 border-b border-slate-800 ${isDesktopExpanded ? 'justify-between' : 'justify-center lg:justify-center justify-between'}`}>
          {/* Logo - Hide on collapsed desktop unless mobile */}
          <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${!isDesktopExpanded && 'lg:w-0 lg:opacity-0'}`}>
             <div className="w-8 h-8 rounded bg-emerald-500 flex items-center justify-center font-bold text-white flex-shrink-0 shadow-lg shadow-emerald-500/20">P</div>
             <span className="text-xl font-bold tracking-wider text-emerald-400 whitespace-nowrap">PSSM</span>
          </div>

          {/* Collapsed Logo (Icon only) */}
          {!isDesktopExpanded && (
            <div className="hidden lg:flex w-8 h-8 rounded bg-emerald-500 items-center justify-center font-bold text-white flex-shrink-0 shadow-lg shadow-emerald-500/20">
              P
            </div>
          )}

          {/* Desktop Toggle Button */}
          <button onClick={toggleDesktop} className="hidden lg:flex text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-800">
            {isDesktopExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>

          {/* Mobile Close Button */}
          <button onClick={toggleMobile} className="lg:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-3 custom-scrollbar">
          
          {/* Main Links */}
          <nav className="space-y-1 mb-8">
            {isDesktopExpanded && (
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-3">
                Main Menu
              </div>
            )}
            {filteredLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                title={!isDesktopExpanded ? link.label : ''}
                className={({ isActive }) =>
                  `flex items-center py-2.5 rounded-lg transition-all duration-200 group relative
                   ${isDesktopExpanded ? 'px-3' : 'px-0 justify-center'}
                   ${isActive
                      ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-600/20'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100 hover:pl-4 border border-transparent'
                   }`
                }
              >
                <span className={`${isDesktopExpanded ? 'mr-3' : ''} transition-all`}>
                  {link.icon}
                </span>
                
                <span 
                  className={`whitespace-nowrap transition-all duration-300 overflow-hidden font-medium
                    ${isDesktopExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0 hidden lg:block'}
                    lg:block block 
                  `}
                >
                  {link.label}
                </span>

                {/* Notification Badge for Super Admin User Mgmt */}
                {link.label === 'User Mgmt' && role === UserRole.SUPER_ADMIN && isDesktopExpanded && (
                   <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                     {pendingApprovals}
                   </span>
                )}
                {/* Collapsed Badge Dot */}
                {link.label === 'User Mgmt' && role === UserRole.SUPER_ADMIN && !isDesktopExpanded && (
                   <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border border-slate-900"></span>
                )}

                {!isDesktopExpanded && (
                  <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-4 bg-slate-800 text-white text-xs px-2 py-1.5 rounded shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 hidden lg:block border border-slate-700">
                    {link.label}
                  </div>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Bottom Links (Settings etc) */}
          <nav className="space-y-1 pt-4 border-t border-slate-800">
             {isDesktopExpanded && (
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-3">
                System
              </div>
            )}
            {bottomLinks.map((link) => (
               <NavLink
                key={link.to}
                to={link.to}
                title={!isDesktopExpanded ? link.label : ''}
                className={({ isActive }) =>
                  `flex items-center py-2.5 rounded-lg transition-all duration-200 group relative
                   ${isDesktopExpanded ? 'px-3' : 'px-0 justify-center'}
                   ${isActive
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100 border border-transparent'
                   }`
                }
              >
                 <span className={`${isDesktopExpanded ? 'mr-3' : ''} transition-all`}>
                  {link.icon}
                </span>
                <span 
                  className={`whitespace-nowrap transition-all duration-300 overflow-hidden font-medium
                    ${isDesktopExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0 hidden lg:block'}
                    lg:block block 
                  `}
                >
                  {link.label}
                </span>
                {!isDesktopExpanded && (
                  <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-4 bg-slate-800 text-white text-xs px-2 py-1.5 rounded shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 hidden lg:block border border-slate-700">
                    {link.label}
                  </div>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer / User Profile */}
        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <button
            onClick={onLogout}
            title={!isDesktopExpanded ? "Sign Out" : ""}
            className={`flex w-full items-center py-2 text-sm font-medium text-red-400 rounded-md hover:bg-slate-800/50 hover:text-red-300 transition-colors ${isDesktopExpanded ? 'px-2' : 'justify-center'}`}
          >
            <LogOut size={20} className={`${isDesktopExpanded ? 'mr-3' : ''}`} />
            {isDesktopExpanded && <span>Sign Out</span>}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;