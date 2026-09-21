'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { jobsApi, companiesApi } from '@/lib/api';
import { AppSidebar } from '@/components/app-sidebar';
import {
  Briefcase,
  Search,
  Building2,
  ChevronRight,
  Loader2,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [topCompanies, setTopCompanies] = useState<any[]>([]);
  const [totalJobs, setTotalJobs] = useState<number | string>('—');
  const [totalCompanies, setTotalCompanies] = useState<number | string>('—');
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoadingData(true);
        const [jobsRes, compsRes] = await Promise.allSettled([
          jobsApi.searchJobs({ pageSize: 4, sortBy: 'postedAt', sortOrder: 'desc' }),
          companiesApi.getCompanies({ pageSize: 4 }),
        ]);

        if (jobsRes.status === 'fulfilled' && jobsRes.value?.data) {
          setRecentJobs(jobsRes.value.data.jobs || []);
          setTotalJobs(jobsRes.value.data.total ?? 0);
        }
        if (compsRes.status === 'fulfilled' && compsRes.value?.data) {
          setTopCompanies(compsRes.value.data.companies || []);
          setTotalCompanies(compsRes.value.data.total ?? 0);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoadingData(false);
      }
    };

    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const statsCards = [
    {
      label: 'Jobs on Radar',
      value: String(totalJobs),
      desc: 'Active verified openings',
      color: 'blue',
      href: '/jobs',
    },
    {
      label: 'Companies Hiring',
      value: String(totalCompanies),
      desc: 'High-velocity employers',
      color: 'purple',
      href: '/companies',
    },
    {
      label: 'Target Roles',
      value: '2 Presets',
      desc: 'Configured role profiles',
      color: 'indigo',
      href: '/role-profiles',
    },
    {
      label: 'Evidence Claims',
      value: 'Verified',
      desc: '100% deterministic proofs',
      color: 'cyan',
      href: '/profile/evidence',
    },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      <AppSidebar />

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top bar */}
        <header className="h-16 border-b border-border flex items-center justify-between px-6 flex-shrink-0 bg-card/20 backdrop-blur-md">
          <div>
            <h1 className="text-base font-semibold text-foreground">Mission Control</h1>
            <p className="text-xs text-muted-foreground">
              Welcome back, {user?.firstName} 👋 Here is your career market radar
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/jobs">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-500 gap-1.5 text-xs font-semibold h-9">
                <Search className="w-3.5 h-3.5" />
                Find Jobs
              </Button>
            </Link>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statsCards.map((stat) => (
              <Link key={stat.label} href={stat.href}>
                <div className="glass rounded-2xl p-5 hover:border-blue-500/40 transition-all duration-200 group cursor-pointer border border-border/80">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                  <p className="text-2xl font-bold text-foreground mt-2">{stat.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{stat.desc}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* ATS Tailoring & Version Control Engine Banner */}
          <div className="glass rounded-2xl p-5 border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">ATS Tailoring & Version Control Engine</h3>
                <p className="text-xs text-muted-foreground">
                  Score your resume deterministically against target jobs, re-rank verified evidence, and export ATS-ready documents.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/resumes">
                <Button size="sm" variant="outline" className="text-xs font-semibold h-8 border-border">
                  Resume Hub
                </Button>
              </Link>
              <Link href="/resumes/tailor">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold h-8 shadow-[0_0_15px_rgba(99,102,241,0.3)] gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Launch Studio
                </Button>
              </Link>
            </div>
          </div>

          {/* 2-Column Split: Market Radar Highlights + Hiring Companies */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Jobs Column (2 Cols) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-blue-400" />
                    Recent Opportunities on Radar
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Latest postings ingested and normalized from ecosystem feeds
                  </p>
                </div>
                <Link href="/jobs">
                  <Button variant="ghost" size="sm" className="text-xs text-blue-400 hover:text-blue-300 gap-1">
                    View All <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>

              {recentJobs.length === 0 && !loadingData ? (
                <div className="glass rounded-2xl p-8 text-center border border-dashed border-border space-y-3">
                  <p className="text-xs text-muted-foreground">No recent jobs synced yet.</p>
                  <Link href="/jobs">
                    <Button size="sm" variant="outline" className="text-xs">
                      Explore Job Radar
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentJobs.map((job) => (
                    <Link key={job.id} href={`/jobs/${job.id}`}>
                      <Card className="glass border-border/80 hover:border-blue-500/40 transition-all duration-150 group">
                        <CardContent className="p-4 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-sm font-bold text-blue-300 flex-shrink-0">
                              {job.company?.name?.slice(0, 2).toUpperCase() || 'CO'}
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-foreground group-hover:text-blue-400 transition-colors line-clamp-1">
                                {job.title}
                              </h3>
                              <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                                <span>{job.company?.name}</span>
                                <span>•</span>
                                <span>{job.location || 'Remote'}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 flex-shrink-0">
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px] uppercase font-semibold',
                                job.workMode === 'REMOTE' && 'border-cyan-500/30 text-cyan-400',
                                job.workMode === 'HYBRID' && 'border-purple-500/30 text-purple-400',
                                job.workMode === 'ONSITE' && 'border-amber-500/30 text-amber-400',
                              )}
                            >
                              {job.workMode || 'HYBRID'}
                            </Badge>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Hiring Companies Column (1 Col) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-purple-400" />
                    Top Hiring Employers
                  </h2>
                  <p className="text-xs text-muted-foreground">High-activity technology teams</p>
                </div>
                <Link href="/companies">
                  <Button variant="ghost" size="sm" className="text-xs text-purple-400 hover:text-purple-300 gap-1">
                    All <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>

              <div className="space-y-3">
                {topCompanies.map((company) => (
                  <Link key={company.id} href={`/jobs?companyName=${encodeURIComponent(company.name)}`}>
                    <Card className="glass border-border/80 hover:border-purple-500/40 transition-all duration-150 group">
                      <CardContent className="p-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-300 flex-shrink-0">
                            {company.name?.slice(0, 2).toUpperCase() || 'CO'}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-semibold text-foreground truncate group-hover:text-purple-400 transition-colors">
                              {company.name}
                            </h4>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {company.headquarters || 'Tech Employer'}
                            </p>
                          </div>
                        </div>

                        <Badge variant="secondary" className="text-[10px] bg-purple-500/10 text-purple-300 font-medium flex-shrink-0">
                          {company.activeJobsCount || 1} Open
                        </Badge>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
