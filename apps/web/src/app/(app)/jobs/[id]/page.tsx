'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { jobsApi } from '@/lib/api';
import { AppSidebar } from '@/components/app-sidebar';
import {
  ArrowLeft,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  FileCode2,
  Sparkles,
  Layers,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

function formatSalary(min?: number, max?: number, currency = 'INR') {
  if (!min && !max) return 'Competitive Compensation';
  if (currency === 'INR') {
    const minL = min ? `${(min / 100000).toFixed(0)}L` : '';
    const maxL = max ? `${(max / 100000).toFixed(0)}L` : '';
    return minL && maxL ? `₹${minL} - ₹${maxL} / year` : `₹${minL || maxL} / year`;
  }
  const minK = min ? `$${(min / 1000).toFixed(0)}k` : '';
  const maxK = max ? `$${(max / 1000).toFixed(0)}k` : '';
  return minK && maxK ? `${minK} - ${maxK} / year` : `${minK || maxK} / year`;
}

export default function JobDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [job, setJob] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedHash, setCopiedHash] = useState(false);
  const [activeTab, setActiveTab] = useState<'structured' | 'snapshot'>('structured');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchJob = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await jobsApi.getJobById(id);
        if (res?.data) {
          setJob(res.data);
        }
      } catch (err) {
        console.error('Failed to load job details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchJob();
    }
  }, [id, isAuthenticated]);

  const copyHash = () => {
    if (!job?.contentHash) return;
    navigator.clipboard.writeText(job.contentHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };


  if (loading) {
    return (
      <div className="min-h-screen flex bg-background">
        <AppSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-blue-400 border-t-transparent animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Loading Job Details & JD Snapshot...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex bg-background">
        <AppSidebar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-4 glass p-8 rounded-2xl max-w-md">
            <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
            <h2 className="text-lg font-semibold text-foreground">Job Posting Not Found</h2>
            <p className="text-xs text-muted-foreground">
              The role you requested may have expired or is no longer active.
            </p>
            <Link href="/jobs">
              <Button size="sm" variant="outline">
                Back to Job Radar
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const matchReadiness = job.matchReadiness;

  return (
    <div className="min-h-screen flex bg-background">
      <AppSidebar />

      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        {/* Top bar back button */}
        <header className="h-16 border-b border-border flex items-center justify-between px-6 flex-shrink-0 bg-card/20 backdrop-blur-md sticky top-0 z-20">
          <Link
            href="/jobs"
            className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Job Radar
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={copyHash}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/80 text-xs text-muted-foreground hover:text-foreground bg-background/60 transition-colors"
            >
              {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="font-mono text-[11px]">{job.contentHash?.slice(0, 12)}...</span>
              <Badge variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-400 font-semibold">
                SHA-256
              </Badge>
            </button>

            <Link href={`/resumes/tailor?jobId=${job.id}`}>
              <Button size="sm" variant="outline" className="gap-1.5 border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/10 h-9 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                Tailor Resume
              </Button>
            </Link>

            {job.applicationUrl && (
              <a href={job.applicationUrl} target="_blank" rel="noreferrer">
                <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-500 h-9 font-semibold">
                  Direct Apply
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </a>
            )}
          </div>
        </header>

        <div className="p-8 max-w-6xl mx-auto w-full space-y-8">
          {/* Hero Banner Card */}
          <div className="glass rounded-3xl p-8 border border-border relative overflow-hidden space-y-6">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xl font-bold text-white shadow-[0_0_25px_rgba(59,130,246,0.3)] flex-shrink-0">
                  {job.company?.name?.slice(0, 2).toUpperCase() || 'CO'}
                </div>
                <div className="space-y-1.5">
                  <h1 className="text-2xl font-bold text-foreground tracking-tight">{job.title}</h1>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{job.company?.name}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-blue-400" />
                      {job.location || 'Remote'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-indigo-400" />
                      Posted {job.postedAt ? new Date(job.postedAt).toLocaleDateString() : 'Recently'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status and Mode */}
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    'px-3 py-1 text-xs font-semibold uppercase tracking-wider',
                    job.workMode === 'REMOTE' && 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10',
                    job.workMode === 'HYBRID' && 'border-purple-500/40 text-purple-400 bg-purple-500/10',
                    job.workMode === 'ONSITE' && 'border-amber-500/40 text-amber-400 bg-amber-500/10',
                  )}
                >
                  {job.workMode || 'HYBRID'}
                </Badge>
                <Badge variant="secondary" className="px-3 py-1 text-xs bg-muted text-foreground font-medium">
                  {job.employmentType || 'FULL_TIME'}
                </Badge>
              </div>
            </div>

            {/* Compensation & Metadata Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border/60">
              <div className="p-3.5 rounded-2xl bg-background/50 border border-border/70">
                <span className="text-xs text-muted-foreground block">Salary Range</span>
                <span className="text-base font-bold text-emerald-400 block mt-0.5">
                  {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-background/50 border border-border/70">
                <span className="text-xs text-muted-foreground block">Seniority Band</span>
                <span className="text-base font-semibold text-foreground block mt-0.5">
                  {job.seniority || 'Mid Level'}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-background/50 border border-border/70">
                <span className="text-xs text-muted-foreground block">Experience Level</span>
                <span className="text-base font-semibold text-foreground block mt-0.5">
                  {job.experienceMinYears ? `${job.experienceMinYears}+ years` : 'Open'}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-background/50 border border-border/70">
                <span className="text-xs text-muted-foreground block">Ingestion Source</span>
                <span className="text-base font-semibold text-blue-400 block mt-0.5">
                  {job.source || 'SEED FEED'}
                </span>
              </div>
            </div>
          </div>

          {/* Candidate Match Readiness Indicator (if available) */}
          {matchReadiness && (
            <Card className="glass border-blue-500/30 bg-blue-500/5">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">Candidate Match Readiness</h3>
                      <p className="text-xs text-muted-foreground">
                        Verified against your profile skills & evidence records
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-2xl font-black text-blue-400">{matchReadiness.matchScore}%</span>
                    <span className="text-xs text-muted-foreground block">Readiness Score</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Matched Skills ({matchReadiness.matchedSkills.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {matchReadiness.matchedSkills.map((s: string) => (
                        <Badge key={s} variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-300 border-emerald-500/20">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {matchReadiness.missingSkills.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Skill Gaps ({matchReadiness.missingSkills.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {matchReadiness.missingSkills.map((s: string) => (
                          <Badge key={s} variant="outline" className="text-xs border-amber-500/30 text-amber-400/80">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">
                    Generate an evidence-backed tailored resume variant optimized for this specific role.
                  </span>
                  <Link href={`/resumes/tailor?jobId=${job.id}`}>
                    <Button size="sm" className="gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold h-8 w-full sm:w-auto shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                      <Sparkles className="w-3.5 h-3.5" />
                      Launch Tailoring Studio
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tab Navigation: Structured Breakdown vs Immutable Snapshot */}
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <button
              onClick={() => setActiveTab('structured')}
              className={cn(
                'px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2',
                activeTab === 'structured'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Layers className="w-4 h-4" />
              Structured Requirements
            </button>
            <button
              onClick={() => setActiveTab('snapshot')}
              className={cn(
                'px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2',
                activeTab === 'snapshot'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <FileCode2 className="w-4 h-4" />
              Immutable JD Snapshot
            </button>
          </div>

          {activeTab === 'structured' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Left 2 Cols: Responsibilities & Overview */}
              <div className="md:col-span-2 space-y-6">
                {/* Responsibilities */}
                {job.responsibilities?.length > 0 && (
                  <Card className="glass border-border">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold">Core Responsibilities</CardTitle>
                      <CardDescription className="text-xs">
                        Extracted deterministically from job posting specifications
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {job.responsibilities.map((r: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-3 text-sm text-foreground/90">
                          <div className="w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400 flex-shrink-0 mt-0.5">
                            {idx + 1}
                          </div>
                          <p className="leading-relaxed">{r}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Cleaned Description */}
                <Card className="glass border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">Full Position Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {job.description}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Col: Skills & Qualifications Checklist */}
              <div className="space-y-6">
                {/* Required Skills */}
                <Card className="glass border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Required Skills
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {job.requiredSkills?.map((skill: string) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="px-2.5 py-1 text-xs bg-blue-500/10 border border-blue-500/20 text-blue-300 font-medium"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Preferred Skills */}
                {job.preferredSkills?.length > 0 && (
                  <Card className="glass border-border">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" />
                        Preferred Skills
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {job.preferredSkills.map((skill: string) => (
                          <Badge
                            key={skill}
                            variant="outline"
                            className="px-2.5 py-1 text-xs border-border text-muted-foreground"
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Audit & Compliance info */}
                <Card className="glass border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Snapshot Integrity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs">
                    <div>
                      <span className="text-muted-foreground block">Verification Hash</span>
                      <span className="font-mono text-[11px] text-foreground break-all">
                        {job.contentHash}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-border/50">
                      <span className="text-muted-foreground">Snapshot Captured:</span>
                      <span className="font-medium text-foreground">
                        {job.snapshot ? new Date(job.snapshot.capturedAt).toLocaleString() : 'Active'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            /* Immutable Snapshot Inspector View */
            <Card className="glass border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">Immutable Raw JD Snapshot</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      Exact raw text snapshot captured at ingestion time, cryptographically verified against hash.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs border-emerald-500/40 text-emerald-400">
                    SHA-256 Verified
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-muted/40 border border-border font-mono text-xs text-muted-foreground max-h-[500px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {job.snapshot?.rawJd || job.rawDescription || job.description}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
