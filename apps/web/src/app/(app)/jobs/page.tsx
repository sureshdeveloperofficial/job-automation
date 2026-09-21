'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { jobsApi } from '@/lib/api';
import { AppSidebar } from '@/components/app-sidebar';
import {
  Search,
  MapPin,
  DollarSign,
  Clock,
  Building2,
  CheckCircle2,
  RefreshCw,
  ChevronRight,
  ExternalLink,
  Compass,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

function formatSalary(min?: number, max?: number, currency = 'INR') {
  if (!min && !max) return 'Competitive';
  const isLakh = currency === 'INR';
  if (isLakh) {
    const minL = min ? `${(min / 100000).toFixed(0)}L` : '';
    const maxL = max ? `${(max / 100000).toFixed(0)}L` : '';
    return minL && maxL ? `₹${minL} - ₹${maxL} / yr` : `₹${minL || maxL} / yr`;
  }
  const minK = min ? `$${(min / 1000).toFixed(0)}k` : '';
  const maxK = max ? `$${(max / 1000).toFixed(0)}k` : '';
  return minK && maxK ? `${minK} - ${maxK} / yr` : `${minK || maxK} / yr`;
}

function formatTimeAgo(dateStr?: string) {
  if (!dateStr) return 'Recently';
  const postDate = new Date(dateStr).getTime();
  const diffHours = Math.floor((Date.now() - postDate) / (1000 * 60 * 60));
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function JobsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [jobs, setJobs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [workMode, setWorkMode] = useState<string>('ALL');
  const [freshness, setFreshness] = useState<string>('LAST_7_DAYS');
  const [minSalary] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {
        freshness,
        page: 1,
        pageSize: 30,
        sortBy: 'postedAt',
        sortOrder: 'desc',
      };

      if (searchQuery.trim()) params.query = searchQuery.trim();
      if (locationQuery.trim()) params.location = locationQuery.trim();
      if (workMode !== 'ALL') params.workModes = [workMode];
      if (minSalary) params.salaryMin = minSalary;

      const res = await jobsApi.searchJobs(params);
      if (res?.data?.jobs) {
        setJobs(res.data.jobs);
        setTotal(res.data.total);
        if (res.data.jobs.length > 0 && !selectedJob) {
          setSelectedJob(res.data.jobs[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  }, [freshness, searchQuery, locationQuery, workMode, minSalary, selectedJob]);

  useEffect(() => {
    if (isAuthenticated) {
      loadJobs();
    }
  }, [isAuthenticated, loadJobs]);

  const handleSyncFeed = async () => {
    try {
      setSyncing(true);
      await jobsApi.syncConnectors('SEED');
      await loadJobs();
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      <AppSidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-border flex items-center justify-between px-6 flex-shrink-0 bg-card/20 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-foreground">Market Job Radar</h1>
              <p className="text-xs text-muted-foreground">
                Live discovery & deterministic analysis across curated tech feeds
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncFeed}
              disabled={syncing}
              className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 gap-2 h-9"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', syncing && 'animate-spin')} />
              {syncing ? 'Syncing Feeds...' : 'Sync Market Feeds'}
            </Button>
            <Link href="/companies">
              <Button variant="ghost" size="sm" className="gap-2 h-9 text-muted-foreground hover:text-foreground">
                <Building2 className="w-4 h-4" />
                Hiring Companies
              </Button>
            </Link>
          </div>
        </header>

        {/* Filter Bar */}
        <div className="border-b border-border p-4 bg-muted/20 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search title, tech stack (e.g. NestJS, React, Python)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-background/60"
              />
            </div>

            <div className="relative w-64">
              <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="City or location (Coimbatore, Bangalore)..."
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                className="pl-9 h-9 bg-background/60"
              />
            </div>

            {/* Work Mode Toggle Pills */}
            <div className="flex items-center bg-background/80 border border-border rounded-lg p-0.5">
              {[
                { id: 'ALL', label: 'All Modes' },
                { id: 'REMOTE', label: 'Remote' },
                { id: 'HYBRID', label: 'Hybrid' },
                { id: 'ONSITE', label: 'Onsite' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setWorkMode(m.id)}
                  className={cn(
                    'px-3 py-1 text-xs font-medium rounded-md transition-all',
                    workMode === m.id
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Freshness & Salary Pills */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                Freshness:
              </span>
              {[
                { id: 'LAST_24H', label: 'Last 24 Hours' },
                { id: 'LAST_3_DAYS', label: '3 Days' },
                { id: 'LAST_7_DAYS', label: '7 Days' },
                { id: 'LAST_30_DAYS', label: '30 Days' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFreshness(f.id)}
                  className={cn(
                    'px-2.5 py-1 rounded-full border transition-all',
                    freshness === f.id
                      ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300 font-medium'
                      : 'border-border/60 hover:bg-muted/60 text-muted-foreground',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span>Found <strong className="text-foreground">{total}</strong> open opportunities</span>
            </div>
          </div>
        </div>

        {/* 2-Column Split: Job Cards List + Quick Preview Pane */}
        <div className="flex-1 flex overflow-hidden">
          {/* Job Feed Column */}
          <div className="w-1/2 flex-1 overflow-y-auto p-4 space-y-3 border-r border-border">
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-400 opacity-60" />
                <p className="text-sm text-muted-foreground">Scanning and ranking active tech roles...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="py-16 text-center space-y-4 glass rounded-2xl p-8 border border-dashed border-border/80">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto text-blue-400">
                  <Compass className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">No roles matching your filters</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    Try broadening your filters or click below to sync the latest roles from Greenhouse, Lever, and seed ecosystem feeds.
                  </p>
                </div>
                <Button onClick={handleSyncFeed} className="gap-2 bg-blue-600 hover:bg-blue-500">
                  <RefreshCw className="w-4 h-4" />
                  Sync Latest Feed Roles
                </Button>
              </div>
            ) : (
              jobs.map((job) => {
                const isSelected = selectedJob?.id === job.id;
                return (
                  <Card
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={cn(
                      'cursor-pointer transition-all duration-150 border hover:border-blue-500/40 bg-card/40 backdrop-blur-sm',
                      isSelected
                        ? 'border-blue-500/60 bg-blue-500/5 shadow-[0_0_20px_rgba(59,130,246,0.12)]'
                        : 'border-border/70 hover:bg-card/70',
                    )}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center text-sm font-bold text-blue-300 flex-shrink-0">
                            {job.company?.name?.slice(0, 2).toUpperCase() || 'CO'}
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-1 hover:text-blue-400 transition-colors">
                              {job.title}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              <span className="font-medium text-foreground/80">{job.company?.name}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {job.location || 'Remote'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] font-semibold uppercase tracking-wider',
                            job.workMode === 'REMOTE' && 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10',
                            job.workMode === 'HYBRID' && 'border-purple-500/40 text-purple-400 bg-purple-500/10',
                            job.workMode === 'ONSITE' && 'border-amber-500/40 text-amber-400 bg-amber-500/10',
                          )}
                        >
                          {job.workMode || 'HYBRID'}
                        </Badge>
                      </div>

                      {/* Meta Pills: Salary & Seniority */}
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-emerald-400 flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5" />
                            {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}
                          </span>
                          {job.seniority && (
                            <Badge variant="secondary" className="text-[10px] bg-muted/80 text-muted-foreground">
                              {job.seniority}
                            </Badge>
                          )}
                        </div>

                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(job.postedAt)}
                        </span>
                      </div>

                      {/* Skills Tags */}
                      {job.requiredSkills?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {job.requiredSkills.slice(0, 4).map((skill: string) => (
                            <span
                              key={skill}
                              className="px-2 py-0.5 rounded-md text-[11px] bg-muted/60 border border-border/60 text-muted-foreground font-mono"
                            >
                              {skill}
                            </span>
                          ))}
                          {job.requiredSkills.length > 4 && (
                            <span className="px-1.5 py-0.5 text-[10px] text-muted-foreground">
                              +{job.requiredSkills.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Quick Preview Panel */}
          <div className="w-1/2 flex flex-col bg-card/20 backdrop-blur-md overflow-hidden">
            {selectedJob ? (
              <div className="flex-1 flex flex-col h-full overflow-y-auto p-6 space-y-6">
                {/* Header info */}
                <div className="space-y-3 pb-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs border-blue-500/40 text-blue-400 bg-blue-500/10">
                        {selectedJob.source || 'FEED'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Posted {formatTimeAgo(selectedJob.postedAt)}
                      </span>
                    </div>

                    <Link href={`/jobs/${selectedJob.id}`}>
                      <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-500 h-8 text-xs font-semibold">
                        View Full Details & JD Inspector
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-foreground">{selectedJob.title}</h2>
                    <p className="text-sm font-medium text-muted-foreground mt-0.5">
                      {selectedJob.company?.name} • {selectedJob.location || 'Remote'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
                    <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold">
                      {formatSalary(selectedJob.salaryMin, selectedJob.salaryMax, selectedJob.salaryCurrency)}
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-muted/60 border border-border/70 text-foreground font-medium">
                      {selectedJob.employmentType || 'Full-Time'}
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-muted/60 border border-border/70 text-foreground font-medium">
                      Level: {selectedJob.seniority || 'Mid'}
                    </div>
                  </div>
                </div>

                {/* Required Skills Matrix */}
                {selectedJob.requiredSkills?.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Required Core Skills ({selectedJob.requiredSkills.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedJob.requiredSkills.map((skill: string) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="px-2.5 py-1 text-xs bg-blue-500/10 border border-blue-500/20 text-blue-300 font-medium"
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1 text-blue-400" />
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preferred Skills */}
                {selectedJob.preferredSkills?.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Preferred / Nice-to-Have
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedJob.preferredSkills.map((skill: string) => (
                        <Badge
                          key={skill}
                          variant="outline"
                          className="px-2.5 py-1 text-xs border-border text-muted-foreground"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Responsibilities */}
                {selectedJob.responsibilities?.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Key Responsibilities
                    </h3>
                    <ul className="space-y-2 text-xs text-foreground/90 leading-relaxed">
                      {selectedJob.responsibilities.map((r: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Full Description snippet */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Role Overview
                  </h3>
                  <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line line-clamp-10">
                    {selectedJob.description}
                  </div>
                </div>

                {/* Footer CTA */}
                <div className="pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground font-mono truncate max-w-[200px]">
                    Hash: {selectedJob.contentHash?.slice(0, 16)}...
                  </span>
                  <div className="flex items-center gap-2">
                    {selectedJob.applicationUrl && (
                      <a href={selectedJob.applicationUrl} target="_blank" rel="noreferrer">
                        <Button variant="outline" size="sm" className="gap-1 text-xs">
                          Direct Apply <ExternalLink className="w-3 h-3" />
                        </Button>
                      </a>
                    )}
                    <Link href={`/jobs/${selectedJob.id}`}>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-xs">
                        Open Full Inspector
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center p-8 text-center text-muted-foreground text-sm">
                Select a job from the list to preview details
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
