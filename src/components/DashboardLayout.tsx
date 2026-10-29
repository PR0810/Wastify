import { type ReactNode, useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Leaf,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  BookOpen,
  Gamepad2,
  ScanLine,
  AlertTriangle,
  Utensils,
  Truck,
  Shield,
  Activity,
  User,
  Radio,
  CheckCircle2,
  Award,
  Calendar,
  Mail,
  MapPin,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getRoleInfo } from '@/lib/constants';

export type NavItem = {
  label: string;
  path: string;
  icon: ReactNode;
  isAction?: boolean;
  actionType?: string;
  variant?: 'default' | 'danger' | 'highlight' | 'toggle';
  badge?: string;
};

export function DashboardLayout({
  children,
  navItems: customNavItems,
}: {
  children: ReactNode;
  navItems?: NavItem[];
}) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Driver GPS tracking state (shared via custom events)
  const [driverGpsOn, setDriverGpsOn] = useState(false);

  useEffect(() => {
    function handleGpsState(e: Event) {
      const customEvent = e as CustomEvent<{ active: boolean }>;
      if (customEvent.detail && typeof customEvent.detail.active === 'boolean') {
        setDriverGpsOn(customEvent.detail.active);
      }
    }
    window.addEventListener('driver-gps-state-changed', handleGpsState);
    return () => window.removeEventListener('driver-gps-state-changed', handleGpsState);
  }, []);

  const roleInfo = profile ? getRoleInfo(profile.role) : null;
  const RoleIcon = roleInfo?.icon ?? Leaf;

  // Build the permanent, role-based navigation that NEVER loses items
  const menuItems: NavItem[] = (() => {
    const role = profile?.role;

    if (role === 'citizen') {
      return [
        {
          label: 'Dashboard',
          path: '/app',
          icon: <LayoutDashboard className="h-5 w-5 text-indigo-500" />,
        },
        {
          label: 'Learn',
          path: '/app/learning',
          icon: <BookOpen className="h-5 w-5 text-emerald-500" />,
        },
        {
          label: 'Games',
          path: '/app/learning?view=games',
          icon: <Gamepad2 className="h-5 w-5 text-purple-500" />,
        },
        {
          label: 'Report Waste',
          path: '#report',
          icon: <AlertTriangle className="h-5 w-5 text-white" />,
          isAction: true,
          actionType: 'open-report-modal',
          variant: 'danger',
        },
        {
          label: 'Donate Food',
          path: '#food',
          icon: <Utensils className="h-5 w-5 text-orange-500" />,
          isAction: true,
          actionType: 'open-food-modal',
        },
      ];
    }

    if (role === 'driver') {
      return [
        {
          label: 'Dashboard',
          path: '/app',
          icon: <LayoutDashboard className="h-5 w-5 text-indigo-500" />,
        },
        {
          label: driverGpsOn ? 'GPS: Broadcasting' : 'GPS: Paused',
          path: '#gps',
          icon: <Radio className={`h-5 w-5 ${driverGpsOn ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />,
          isAction: true,
          actionType: 'toggle-driver-gps',
          variant: 'toggle',
          badge: driverGpsOn ? 'ON' : 'OFF',
        },
        {
          label: 'Work Completed',
          path: '/app?tab=completed',
          icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
          isAction: true,
          actionType: 'switch-tab-completed',
        },
      ];
    }

    if (role === 'admin') {
      return [
        {
          label: 'Overview',
          path: '/app',
          icon: <LayoutDashboard className="h-5 w-5 text-indigo-500" />,
        },
        {
          label: 'Fleet Tracking',
          path: '/app?tab=vehicles',
          icon: <Truck className="h-5 w-5 text-blue-500" />,
          isAction: true,
          actionType: 'admin-tab-vehicles',
        },
        {
          label: 'Waste Reports',
          path: '/app?tab=reports',
          icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
          isAction: true,
          actionType: 'admin-tab-reports',
        },
        {
          label: 'Drivers & Areas',
          path: '/app?tab=drivers',
          icon: <MapPin className="h-5 w-5 text-teal-500" />,
          isAction: true,
          actionType: 'admin-tab-drivers',
        },
      ];
    }

    if (role === 'ngo') {
      return [
        {
          label: 'Dashboard',
          path: '/app',
          icon: <LayoutDashboard className="h-5 w-5 text-indigo-500" />,
        },
        {
          label: 'Surplus Food',
          path: '/app?tab=food',
          icon: <Utensils className="h-5 w-5 text-orange-500" />,
          isAction: true,
          actionType: 'ngo-tab-food',
        },
        {
          label: 'Recyclables',
          path: '/app?tab=recyclables',
          icon: <Activity className="h-5 w-5 text-teal-500" />,
          isAction: true,
          actionType: 'ngo-tab-recyclables',
        },
      ];
    }

    return [
      {
        label: 'Dashboard',
        path: '/app',
        icon: <LayoutDashboard className="h-5 w-5 text-indigo-500" />,
      },
    ];
  })();

  async function handleSignOut() {
    setSidebarOpen(false);
    await signOut();
    navigate('/');
  }

  function handleNavClick(item: NavItem) {
    if (item.isAction && item.actionType) {
      if (item.actionType === 'open-report-modal') {
        if (location.pathname !== '/app') {
          navigate('/app');
          setTimeout(() => window.dispatchEvent(new CustomEvent('open-report-modal')), 150);
        } else {
          window.dispatchEvent(new CustomEvent('open-report-modal'));
        }
      } else if (item.actionType === 'open-food-modal') {
        if (location.pathname !== '/app') {
          navigate('/app');
          setTimeout(() => window.dispatchEvent(new CustomEvent('open-food-modal')), 150);
        } else {
          window.dispatchEvent(new CustomEvent('open-food-modal'));
        }
      } else if (item.actionType === 'toggle-driver-gps') {
        window.dispatchEvent(new CustomEvent('toggle-driver-gps'));
      } else if (item.actionType === 'switch-tab-completed') {
        if (location.pathname !== '/app') {
          navigate('/app');
          setTimeout(() => window.dispatchEvent(new CustomEvent('driver-show-completed')), 150);
        } else {
          window.dispatchEvent(new CustomEvent('driver-show-completed'));
        }
      } else if (item.actionType.startsWith('admin-tab-')) {
        const tab = item.actionType.replace('admin-tab-', '');
        if (location.pathname !== '/app') {
          navigate('/app');
          setTimeout(() => window.dispatchEvent(new CustomEvent('admin-switch-tab', { detail: { tab } })), 150);
        } else {
          window.dispatchEvent(new CustomEvent('admin-switch-tab', { detail: { tab } }));
        }
      } else if (item.actionType.startsWith('ngo-tab-')) {
        const tab = item.actionType.replace('ngo-tab-', '');
        if (location.pathname !== '/app') {
          navigate('/app');
          setTimeout(() => window.dispatchEvent(new CustomEvent('ngo-switch-tab', { detail: { tab } })), 150);
        } else {
          window.dispatchEvent(new CustomEvent('ngo-switch-tab', { detail: { tab } }));
        }
      } else {
        window.dispatchEvent(new CustomEvent(item.actionType));
      }
      setSidebarOpen(false);
      return;
    }

    navigate(item.path);
    setSidebarOpen(false);
  }

  return (
    <div className="flex min-h-screen bg-[#f3f6f9] text-slate-800 font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* SIDEBAR                                                            */}
      {/* ------------------------------------------------------------------ */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 transform border-r border-slate-200/80 bg-white shadow-sm transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 flex flex-col justify-between overflow-y-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="flex h-18 items-center justify-between px-6 border-b border-slate-100">
            <Link to="/app" className="flex items-center gap-2.5 group">
              <img
                src="/wastify-logo.png"
                alt="Wastify"
                className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden rounded-xl p-2 text-slate-400 hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1.5">
            {menuItems.map((item) => {
              const isActive =
                !item.isAction &&
                (location.pathname === item.path ||
                  (item.path !== '/app' && location.pathname.startsWith(item.path)));

              // Red Action Button (Report Waste)
              if (item.variant === 'danger') {
                return (
                  <button
                    key={item.label}
                    onClick={() => handleNavClick(item)}
                    className="flex w-full items-center gap-3.5 rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-red-500/25 transition-all hover:bg-red-700 active:scale-[0.98] cursor-pointer mt-2.5"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/20 text-white font-extrabold text-[10px]">
                      SOS
                    </span>
                    <span>{item.label}</span>
                  </button>
                );
              }

              // Toggle Button (GPS ON/OFF)
              if (item.variant === 'toggle') {
                return (
                  <button
                    key={item.label}
                    onClick={() => handleNavClick(item)}
                    className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-bold transition-all cursor-pointer ${
                      driverGpsOn
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                        driverGpsOn ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  </button>
                );
              }

              // Active Item
              if (isActive) {
                return (
                  <button
                    key={item.label}
                    onClick={() => handleNavClick(item)}
                    className="flex w-full items-center gap-3.5 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                  >
                    <span className="text-white brightness-125">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              }

              // Inactive Normal Item
              return (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item)}
                  className="flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-[0.99] cursor-pointer"
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Profile Button inside the main menu */}
            <button
              onClick={() => {
                setProfileModalOpen(true);
                setSidebarOpen(false);
              }}
              className="flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-[0.99] cursor-pointer"
            >
              <User className="h-5 w-5 text-teal-600" />
              <span>Profile</span>
            </button>
          </nav>
        </div>

        {/* Clean Docked Footer with User Info & Sign Out */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <div
            onClick={() => setProfileModalOpen(true)}
            className="flex items-center gap-3 rounded-2xl bg-slate-50 p-2.5 mb-2 border border-slate-100 cursor-pointer hover:bg-slate-100/80 transition-colors"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold shadow-xs shrink-0">
              <RoleIcon className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-slate-900">{profile?.full_name || 'User'}</p>
              <p className="truncate text-[10px] font-medium text-slate-500 capitalize">{roleInfo?.label}</p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MAIN VIEW CANVAS                                                   */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Mobile Header Bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-xl p-2 text-slate-600 hover:bg-slate-100"
          >
            <Menu className="h-5 w-5" />
          </button>
          <img src="/wastify-logo.png" alt="Wastify" className="h-7 w-auto object-contain" />
          <div
            onClick={() => setProfileModalOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white cursor-pointer"
          >
            <RoleIcon className="h-4 w-4" />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl animate-fade-in">{children}</div>
        </main>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* UNIFIED PROFILE MODAL (Available everywhere)                       */}
      {/* ------------------------------------------------------------------ */}
      {profileModalOpen && profile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl animate-scale-in">
            <button
              onClick={() => setProfileModalOpen(false)}
              className="absolute top-5 right-5 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-extrabold shadow-md">
                <RoleIcon className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">{profile.full_name}</h3>
                <span className="inline-block mt-0.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 capitalize">
                  {roleInfo?.label}
                </span>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl bg-slate-50 p-4 border border-slate-100 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <Mail className="h-3.5 w-3.5 text-slate-400" /> Email
                </span>
                <span className="font-bold text-slate-800">{profile.email}</span>
              </div>

              {profile.age != null && (
                <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" /> Age
                  </span>
                  <span className="font-bold text-slate-800">{profile.age} years</span>
                </div>
              )}

              <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <Award className="h-3.5 w-3.5 text-amber-500" /> Civic Reward Points
                </span>
                <span className="font-extrabold text-amber-600 text-sm">{profile.points} pts</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Account Status
                </span>
                <span className="font-bold text-emerald-700">Active & Verified</span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setProfileModalOpen(false)}
                className="w-1/2 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={handleSignOut}
                className="w-1/2 rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white hover:bg-red-700 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
