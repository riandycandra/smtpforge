"use client";

import Link from 'next/link';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Mail, Key, Activity, Server, LayoutDashboard, LogOut, Settings as SettingsIcon, Sun, Moon, Bell, PanelLeftClose, PanelLeft } from 'lucide-react';
import { AuthService } from '@/services/api/auth.service';
import { useTheme } from '../theme-provider';
import Image from 'next/image';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'SMTP Accounts', href: '/dashboard/smtp', icon: Server },
  { name: 'API Keys', href: '/dashboard/api-keys', icon: Key },
  { name: 'Email Logs', href: '/dashboard/logs', icon: Mail },
  { name: 'Metrics', href: '/dashboard/metrics', icon: Activity },
  { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
  { name: 'Settings', href: '/dashboard/settings', icon: SettingsIcon },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const isCollapsed = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener('storage', onStoreChange);
      return () => window.removeEventListener('storage', onStoreChange);
    },
    () => localStorage.getItem('sidebar_collapsed') === 'true',
    () => false
  );

  const isExpanded = !isCollapsed || isHovered;

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const toggleSidebar = () => {
    const next = !isCollapsed;
    setIsHovered(false);
    localStorage.setItem('sidebar_collapsed', String(next));
    window.dispatchEvent(new Event('storage'));
  };

  const handleLogout = () => {
    AuthService.logout();
    router.push('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Sidebar Spacer to reserve layout space when collapsed */}
      <div
        className="shrink-0"
        style={{
          width: isCollapsed ? '5rem' : '16rem',
          transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        onMouseEnter={() => {
          if (isCollapsed) setIsHovered(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
        }}
        style={{
          width: isExpanded ? '16rem' : '5rem',
          transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        className={`fixed inset-y-0 left-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col z-30 select-none overflow-hidden ${
          isExpanded ? 'shadow-2xl' : ''
        }`}
      >
        <div className="h-16 flex items-center px-5 border-b border-gray-200 dark:border-gray-800">
          <div className="w-8 h-8 relative rounded-lg overflow-hidden border border-gray-100 dark:border-gray-800 shrink-0">
            <Image
              src="/icon.svg"
              alt="SMTP Forge Logo"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap ${
            isExpanded ? 'max-w-[200px] opacity-100 ml-3' : 'max-w-0 opacity-0 ml-0 pointer-events-none'
          }`}>
            <span className="text-lg text-gray-900 dark:text-gray-100">
              <span className="font-bold">SMTP</span> Forge
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar overflow-x-hidden">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    title={!isExpanded ? item.name : undefined}
                    className={`flex items-center rounded-lg text-sm font-medium h-10 px-3 transition-colors duration-200 ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className={`h-5 w-5 shrink-0 transition-colors duration-200 ${
                      isActive ? 'text-blue-700 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                    }`} />
                    <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap ${
                      isExpanded ? 'max-w-[180px] opacity-100 ml-3' : 'max-w-0 opacity-0 ml-0 pointer-events-none'
                    }`}>
                      <span className="truncate">
                        {item.name}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-gray-200 dark:border-gray-800 p-3">
          <button
            onClick={handleLogout}
            title={!isExpanded ? "Logout" : undefined}
            className="flex items-center w-full h-10 px-3 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
          >
            <LogOut className="h-5 w-5 shrink-0 text-gray-400 dark:text-gray-500" />
            <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap ${
              isExpanded ? 'max-w-[180px] opacity-100 ml-3' : 'max-w-0 opacity-0 ml-0 pointer-events-none'
            }`}>
              <span className="truncate">
                Logout
              </span>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-6 lg:px-8 shadow-sm z-10 shrink-0">
          {/* Toggle Sidebar Button */}
          <button
            onClick={toggleSidebar}
            className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-all active:scale-95 shadow-sm mr-4"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <PanelLeft className="w-5 h-5" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>

          <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            Operational Dashboard
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="relative flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all active:scale-95 shadow-sm"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <Moon className="w-[18px] h-[18px] text-gray-600" />
            ) : (
              <Sun className="w-[18px] h-[18px] text-amber-400" />
            )}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-gray-50 dark:bg-gray-950">
          {children}
        </main>
      </div>
    </div>
  );
}
