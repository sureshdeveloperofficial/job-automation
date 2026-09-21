'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { companiesApi, jobsApi } from '@/lib/api';
import { AppSidebar } from '@/components/app-sidebar';
import {
  Building2,
  Search,
  MapPin,
  TrendingUp,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Sparkles,
  Globe,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function CompaniesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [companies, setCompanies] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('ALL');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const loadCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {
        page: 1,
        pageSize: 30,
        isHiringNow: true,
      };

      if (searchQuery.trim()) params.query = searchQuery.trim();
      if (selectedIndustry !== 'ALL') params.industry = selectedIndustry;

      const res = await companiesApi.getCompanies(params);
      if (res?.data?.companies) {
        setCompanies(res.data.companies);
        setTotal(res.data.total);
      }
    } catch (err) {
      console.error('Failed to load companies:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedIndustry]);

  useEffect(() => {
    if (isAuthenticated) {
      loadCompanies();
    }
  }, [isAuthenticated, loadCompanies]);

  const handleSyncFeeds = async () => {
    try {
      setSyncing(true);
      await jobsApi.syncConnectors('SEED');
      await loadCompanies();
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  const industries = ['ALL', 'Technology', 'Fintech', 'Developer Tools', 'Logistics'];

  return (
    <div className="min-h-screen flex bg-background">
      <AppSidebar />

      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border flex items-center justify-between px-6 flex-shrink-0 bg-card/20 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-purple-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-foreground">Companies Hiring Now</h1>
              <p className="text-xs text-muted-foreground">
                High hiring velocity employers verified by automated feed ingestion
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncFeeds}
            disabled={syncing}
            className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 gap-2 h-9"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', syncing && 'animate-spin')} />
            {syncing ? 'Scanning Companies...' : 'Scan Feeds'}
          </Button>
        </header>

        {/* Filter Bar */}
        <div className="border-b border-border p-4 bg-muted/20 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search company name or domain..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-background/60"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {industries.map((ind) => (
                <button
                  key={ind}
                  onClick={() => setSelectedIndustry(ind)}
                  className={cn(
                    'px-3 py-1 text-xs font-medium rounded-lg border transition-all',
                    selectedIndustry === ind
                      ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                      : 'border-border/60 text-muted-foreground hover:text-foreground',
                  )}
                >
                  {ind}
                </button>
              ))}
            </div>
          </div>

          <span className="text-xs text-muted-foreground">
            Tracking <strong className="text-foreground">{total}</strong> active hiring organizations
          </span>
        </div>

        {/* Grid Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-purple-400 opacity-60" />
              <p className="text-sm text-muted-foreground">Scanning hiring company records...</p>
            </div>
          ) : companies.length === 0 ? (
            <div className="py-16 text-center space-y-4 glass rounded-2xl p-8 border border-dashed border-border max-w-lg mx-auto">
              <Building2 className="w-12 h-12 mx-auto text-purple-400/60" />
              <div>
                <h3 className="text-base font-semibold text-foreground">No companies recorded yet</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Click the button below to sync top tech companies from verified seed feeds.
                </p>
              </div>
              <Button onClick={handleSyncFeeds} className="bg-purple-600 hover:bg-purple-500 gap-2">
                <RefreshCw className="w-4 h-4" />
                Populate Tech Employers
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {companies.map((company) => (
                <Card
                  key={company.id}
                  className="glass border-border/80 hover:border-purple-500/40 transition-all duration-200 group flex flex-col justify-between"
                >
                  <CardContent className="p-5 space-y-4">
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center text-base font-bold text-purple-300 flex-shrink-0 group-hover:scale-105 transition-transform">
                          {company.name?.slice(0, 2).toUpperCase() || 'CO'}
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-foreground group-hover:text-purple-400 transition-colors">
                            {company.name}
                          </h3>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {company.headquarters || 'Global / India'}
                          </p>
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1"
                      >
                        <TrendingUp className="w-3 h-3" />
                        Hiring
                      </Badge>
                    </div>

                    {/* Description or details */}
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {company.description ||
                        `Leading technology provider actively recruiting high-performing engineering and product talent.`}
                    </p>

                    {/* Stats strip */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 text-xs">
                      <div className="p-2.5 rounded-xl bg-background/50 border border-border/60">
                        <span className="text-[11px] text-muted-foreground block">Active Roles</span>
                        <span className="text-sm font-bold text-foreground">
                          {company.activeJobsCount || 1} Openings
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-background/50 border border-border/60">
                        <span className="text-[11px] text-muted-foreground block">Hiring Pace</span>
                        <span className="text-xs font-semibold text-purple-400 flex items-center gap-1 mt-0.5">
                          <Sparkles className="w-3 h-3" /> High Velocity
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 flex items-center justify-between gap-2">
                      {company.careersUrl ? (
                        <a
                          href={company.careersUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          Careers Page
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ) : (
                        <div />
                      )}

                      <Link href={`/jobs?companyName=${encodeURIComponent(company.name)}`}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs gap-1 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 h-8"
                        >
                          Browse Roles
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
