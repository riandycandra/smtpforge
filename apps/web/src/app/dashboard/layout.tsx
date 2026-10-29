"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
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
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    if (saved !== null) {
      setIsCollapsed(saved === 'true');
    }
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
  };

  const handleLogout = () => {
    AuthService.logout();
    router.push('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-300 ease-in-out shrink-0 select-none ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className={`h-16 flex items-center border-b border-gray-200 dark:border-gray-800 transition-all duration-300 ${
          isCollapsed ? 'justify-center px-2' : 'gap-3 px-5'
        }`}>
          <div className="w-8 h-8 relative rounded-lg overflow-hidden border border-gray-100 dark:border-gray-800 shrink-0">
            <Image
              src="/icon.svg"
              alt="SMTP Forge Logo"
              fill
              className="object-cover"
              priority
            />
          </div>
          {!isCollapsed && (
            <span className="text-lg text-gray-900 dark:text-gray-100 truncate animate-in fade-in duration-200">
              <span className="font-bold">SMTP</span> Forge
            </span>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          <ul className={`space-y-1 ${isCollapsed ? 'px-2' : 'px-3'}`}>
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    title={isCollapsed ? item.name : undefined}
                    className={`flex items-center rounded-lg text-sm font-medium transition-all ${
                      isCollapsed
                        ? 'justify-center px-0 py-2.5 h-10 w-full'
                        : 'px-3 py-2'
                    } ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className={`h-5 w-5 shrink-0 ${
                      !isCollapsed ? 'mr-3' : ''
                    } ${isActive ? 'text-blue-700 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
                    {!isCollapsed && (
                      <span className="truncate animate-in fade-in duration-200">
                        {item.name}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className={`border-t border-gray-200 dark:border-gray-800 ${isCollapsed ? 'p-2' : 'p-4'}`}>
          <button
            onClick={handleLogout}
            title={isCollapsed ? "Logout" : undefined}
            className={`flex items-center w-full text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 rounded-lg transition-all ${
              isCollapsed
                ? 'justify-center px-0 py-2.5 h-10'
                : 'px-3 py-2'
            }`}
          >
            <LogOut className={`h-5 w-5 shrink-0 ${
              !isCollapsed ? 'mr-3' : ''
            } text-gray-400 dark:text-gray-500`} />
            {!isCollapsed && (
              <span className="truncate animate-in fade-in duration-200">
                Logout
              </span>
            )}
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
