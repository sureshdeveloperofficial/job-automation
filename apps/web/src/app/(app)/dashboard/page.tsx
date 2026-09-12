'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import {
  LayoutDashboard,
  Search,
  Briefcase,
  Building2,
  FileText,
  Send,
  UserCircle,
  BarChart3,
  Settings,
  Bell,
  LogOut,
  ChevronRight,
  Loader2,
  ShieldCheck,
  Sliders,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', active: true },
  { icon: Search, label: 'Find Jobs', href: '/jobs' },
  { icon: Building2, label: 'Companies', href: '/companies' },
  { icon: UserCircle, label: 'Profile', href: '/profile' },
  { icon: ShieldCheck, label: 'Evidence Ledger', href: '/profile/evidence' },
  { icon: Sliders, label: 'Role Targets', href: '/role-profiles' },
  { icon: FileText, label: 'Resumes', href: '/resumes' },
  { icon: Send, label: 'Applications', href: '/applications' },
  { icon: Briefcase, label: 'Interviews', href: '/interviews' },
  { icon: BarChart3, label: 'Analytics', href: '/analytics' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

const statsCards = [
  { label: 'Jobs Found', value: '—', trend: null, color: 'blue' },
  { label: 'Best Matches', value: '—', trend: null, color: 'indigo' },
  { label: 'Applications', value: '—', trend: null, color: 'purple' },
  { label: 'Interviews', value: '—', trend: null, color: 'cyan' },
];

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-border flex flex-col glass">
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-base font-semibold gradient-text">AI Career OS</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              id={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                item.active
                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
              {item.active && (
                <ChevronRight className="w-3 h-3 ml-auto text-blue-400" />
              )}
            </Link>
          ))}
        </nav>

        {/* User area */}
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg mb-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            id="nav-signout"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-150"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top bar */}
        <header className="h-16 border-b border-border flex items-center justify-between px-6 flex-shrink-0">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
            <p className="text-xs text-muted-foreground">
              Welcome back, {user?.firstName} 👋
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              id="notifications-btn"
              className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all relative"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500" />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 animate-fade-in">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {statsCards.map((stat) => (
              <div
                key={stat.label}
                className="glass rounded-xl p-5 hover:border-blue-500/20 transition-all duration-200"
              >
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">Complete your profile to start</p>
              </div>
            ))}
          </div>

          {/* Empty State — Onboarding CTA */}
          <div className="glass rounded-2xl p-10 text-center max-w-2xl mx-auto mt-8">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center mx-auto mb-5">
              <Briefcase className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              Set up your career profile
            </h2>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto leading-relaxed">
              Complete your profile so AI Career OS can find the best matching jobs, tailor
              your resume, and prepare your applications.
            </p>
            <Link
              href="/onboarding"
              id="start-onboarding-btn"
              className={cn(
                'inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold',
                'bg-blue-500 hover:bg-blue-400 text-white transition-all duration-200',
              )}
            >
              Complete Profile
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
