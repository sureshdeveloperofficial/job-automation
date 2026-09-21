'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { resumesApi } from '@/lib/api';
import { AppSidebar } from '@/components/app-sidebar';
import {
  ArrowLeft,
  Download,
  Printer,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileText,
  GitCommit,
  Building2,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Briefcase,
  ShieldCheck,
  Award,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ResumeAST {
  personalInfo?: {
    fullName?: string;
    headline?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedinUrl?: string;
    githubUrl?: string;
  };
  summary?: string;
  skills?: {
    core?: string[];
    secondary?: string[];
    tools?: string[];
  };
  experiences?: Array<{
    company: string;
    role: string;
    location?: string;
    startDate: string;
    endDate?: string;
    current?: boolean;
    bullets: Array<string | { text: string }>;
  }>;
  education?: Array<{
    institution: string;
    degree?: string;
    field?: string;
    startDate: string;
    endDate?: string;
  }>;
  projects?: Array<{
    name: string;
    description?: string;
    url?: string;
  }>;
}

interface AtsScoreResult {
  overallScore: number;
  breakdown: {
    requiredSkills: { score: number; feedback: string };
    preferredSkills: { score: number; feedback: string };
    experienceAlignment: { score: number; feedback: string };
    quantifiableImpact: { score: number; feedback: string };
    formattingHygiene: { score: number; feedback: string };
  };
  matchedSkills: string[];
  missingSkills: string[];
  recommendations: string[];
}

interface ResumeDiff {
  summaryChanged: boolean;
  summaryDiff: { base: string; tailored: string };
  skillsDiff: { added: string[]; removed: string[]; promoted: string[]; preserved: string[] };
  experienceDiff: Array<{
    role: string;
    company: string;
    bulletsReordered: boolean;
    tailoredBullets: string[];
  }>;
  atsScoreDelta: number;
  totalChangesCount: number;
}

export default function ResumeVariantPage() {
  const params = useParams<{ id: string }>();
  const variantId = params.id;
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [variant, setVariant] = useState<any | null>(null);
  const [diff, setDiff] = useState<ResumeDiff | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'document' | 'audit' | 'diff'>('document');
  const [selectedTemplate, setSelectedTemplate] = useState<'MODERN' | 'CLASSIC' | 'MINIMAL'>('MODERN');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!variantId) return;
      try {
        setLoading(true);
        const [variantRes, diffRes] = await Promise.all([
          resumesApi.getVariant(variantId),
          resumesApi.getVariantDiff(variantId).catch(() => null),
        ]);

        if (variantRes?.data) {
          setVariant(variantRes.data);
        }
        if (diffRes?.data) {
          setDiff(diffRes.data);
        }
      } catch (err) {
        console.error('Failed to load resume variant:', err);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchData();
    }
  }, [variantId, isAuthenticated]);

  const handleExport = async (format: 'html' | 'text') => {
    if (!variantId) return;
    try {
      setExporting(true);
      const res = await resumesApi.exportVariant(variantId, format, selectedTemplate);
      if (res?.data) {
        const { filename } = res.data;
        const content = format === 'html' ? res.data.html : res.data.text;
        const mimeType = format === 'html' ? 'text/html' : 'text/plain';

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `resume-variant.${format === 'html' ? 'html' : 'txt'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = async () => {
    if (!variantId) return;
    try {
      setExporting(true);
      const res = await resumesApi.exportVariant(variantId, 'html', selectedTemplate);
      if (res?.data?.html) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(res.data.html);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
          }, 350);
        }
      }
    } catch (err) {
      console.error('Print preview failed:', err);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex bg-background">
        <AppSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Loading Resume Variant & ATS Audit...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!variant) {
    return (
      <div className="min-h-screen flex bg-background">
        <AppSidebar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-4 glass p-8 rounded-2xl max-w-md">
            <AlertTriangle className="w-10 h-10 text-destructive mx-auto" />
            <h2 className="text-lg font-semibold text-foreground">Variant Not Found</h2>
            <p className="text-xs text-muted-foreground">
              The requested resume variant does not exist or has been removed.
            </p>
            <Link href="/resumes">
              <Button size="sm" variant="outline">
                Back to Resume Hub
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const ast: ResumeAST = variant.structuredData || {};
  const breakdown: AtsScoreResult | null = variant.atsBreakdown || null;
  const atsScore = variant.atsScore || 0;

  return (
    <div className="min-h-screen flex bg-background">
      <AppSidebar />

      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        {/* Top Header */}
        <header className="h-16 border-b border-border flex items-center justify-between px-6 flex-shrink-0 bg-card/20 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <Link
              href="/resumes"
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Resume Hub
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
            <span className="text-xs font-semibold text-foreground truncate max-w-[200px] md:max-w-xs">
              {variant.resume?.name || 'Resume'} (v{variant.version})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrint}
              disabled={exporting}
              className="gap-1.5 h-8 text-xs font-medium border-border/80"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / PDF
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExport('text')}
              disabled={exporting}
              className="gap-1.5 h-8 text-xs font-medium border-border/80"
            >
              <FileText className="w-3.5 h-3.5" />
              Plain Text
            </Button>
            <Button
              size="sm"
              onClick={() => handleExport('html')}
              disabled={exporting}
              className="gap-1.5 h-8 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
            >
              <Download className="w-3.5 h-3.5" />
              Export HTML
            </Button>
          </div>
        </header>

        <div className="p-8 max-w-6xl mx-auto w-full space-y-6">
          {/* Hero Variant Banner */}
          <div className="glass rounded-3xl p-6 md:p-8 border border-border relative overflow-hidden space-y-6">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] flex-shrink-0">
                  <FileText className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">
                      {variant.resume?.name || 'Tailored Resume'}
                    </h1>
                    <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/30 text-xs font-semibold">
                      v{variant.version}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {variant.targetCompany && (
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                        Target: {variant.targetCompany}
                      </span>
                    )}
                    {variant.targetJob && (
                      <>
                        <span>•</span>
                        <Link
                          href={`/jobs/${variant.targetJob.id}`}
                          className="text-blue-400 hover:underline flex items-center gap-1"
                        >
                          {variant.targetJob.title}
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </>
                    )}
                    <span>•</span>
                    <span>Created {new Date(variant.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* ATS Score Dial Card */}
              <div className="flex items-center gap-4 bg-background/60 p-3.5 rounded-2xl border border-border/80">
                <div className="text-right">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    ATS Match Score
                  </span>
                  <span
                    className={cn(
                      'text-2xl font-black block',
                      atsScore >= 80 ? 'text-emerald-400' : atsScore >= 60 ? 'text-blue-400' : 'text-amber-400',
                    )}
                  >
                    {atsScore}%
                  </span>
                </div>
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base',
                    atsScore >= 80
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : atsScore >= 60
                      ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                      : 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
                  )}
                >
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Sub-tabs Navigation */}
            <div className="flex items-center gap-2 border-t border-border/60 pt-4">
              <button
                onClick={() => setActiveTab('document')}
                className={cn(
                  'px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2',
                  activeTab === 'document'
                    ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40',
                )}
              >
                <FileText className="w-3.5 h-3.5" />
                Document View
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={cn(
                  'px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2',
                  activeTab === 'audit'
                    ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40',
                )}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                ATS Audit & Recommendations
                {breakdown?.recommendations && breakdown.recommendations.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-[10px] bg-background/40">
                    {breakdown.recommendations.length}
                  </Badge>
                )}
              </button>
              <button
                onClick={() => setActiveTab('diff')}
                className={cn(
                  'px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2',
                  activeTab === 'diff'
                    ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40',
                )}
              >
                <GitCommit className="w-3.5 h-3.5" />
                Version Diff & Lineage
                {diff?.totalChangesCount !== undefined && diff.totalChangesCount > 0 && (
                  <Badge variant="secondary" className="ml-1 text-[10px] bg-background/40">
                    {diff.totalChangesCount}
                  </Badge>
                )}
              </button>
            </div>
          </div>

          {/* TAB 1: Document View */}
          {activeTab === 'document' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  ATS Document Preview (Clean Semantic Layout & Print CSS)
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Template:</span>
                  {(['MODERN', 'CLASSIC', 'MINIMAL'] as const).map((tmpl) => (
                    <button
                      key={tmpl}
                      onClick={() => setSelectedTemplate(tmpl)}
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border',
                        selectedTemplate === tmpl
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                          : 'border-border text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {tmpl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rendered Resume Document Card */}
              <div className="bg-white text-slate-900 rounded-2xl p-8 md:p-12 shadow-2xl font-sans border border-slate-200">
                {/* Header */}
                <div className="border-b border-slate-300 pb-5 mb-6 text-center">
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                    {ast.personalInfo?.fullName || 'Candidate Name'}
                  </h2>
                  <p className="text-sm font-medium text-slate-600 mt-1">
                    {ast.personalInfo?.headline || 'Professional'}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-2">
                    {ast.personalInfo?.email && <span>{ast.personalInfo.email}</span>}
                    {ast.personalInfo?.phone && (
                      <>
                        <span>•</span>
                        <span>{ast.personalInfo.phone}</span>
                      </>
                    )}
                    {ast.personalInfo?.location && (
                      <>
                        <span>•</span>
                        <span>{ast.personalInfo.location}</span>
                      </>
                    )}
                    {ast.personalInfo?.linkedinUrl && (
                      <>
                        <span>•</span>
                        <span>{ast.personalInfo.linkedinUrl}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Professional Summary */}
                {ast.summary && (
                  <div className="mb-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">
                      Professional Summary
                    </h3>
                    <p className="text-xs leading-relaxed text-slate-700">{ast.summary}</p>
                  </div>
                )}

                {/* Core Competencies / Skills */}
                {ast.skills && (
                  <div className="mb-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">
                      Core Competencies & Technical Skills
                    </h3>
                    <div className="space-y-1 text-xs text-slate-700">
                      {ast.skills.core && ast.skills.core.length > 0 && (
                        <p>
                          <span className="font-semibold text-slate-900">Core Expertise: </span>
                          {ast.skills.core.join(' • ')}
                        </p>
                      )}
                      {ast.skills.secondary && ast.skills.secondary.length > 0 && (
                        <p>
                          <span className="font-semibold text-slate-900">Additional Skills: </span>
                          {ast.skills.secondary.join(' • ')}
                        </p>
                      )}
                      {ast.skills.tools && ast.skills.tools.length > 0 && (
                        <p>
                          <span className="font-semibold text-slate-900">Tools & Frameworks: </span>
                          {ast.skills.tools.join(' • ')}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Professional Experience */}
                {ast.experiences && ast.experiences.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-3">
                      Professional Experience
                    </h3>
                    <div className="space-y-4">
                      {(ast.experiences || []).map((exp: any, idx: number) => (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="font-bold text-xs text-slate-900">{exp.role}</span>
                              <span className="text-xs text-slate-600"> — {exp.company}</span>
                              {exp.location && (
                                <span className="text-xs text-slate-400"> ({exp.location})</span>
                              )}
                            </div>
                            <span className="text-xs text-slate-500 font-medium">
                              {exp.startDate} – {exp.current ? 'Present' : exp.endDate || ''}
                            </span>
                          </div>
                          <ul className="list-disc list-outside pl-4 space-y-1">
                            {(exp.bullets || []).map((bullet: any, bIdx: number) => {
                              const bulletText = typeof bullet === 'string' ? bullet : bullet.text;
                              return (
                                <li key={bIdx} className="text-xs leading-relaxed text-slate-700">
                                  {bulletText}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {ast.education && ast.education.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">
                      Education
                    </h3>
                    <div className="space-y-2">
                      {(ast.education || []).map((edu: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <div>
                            <span className="font-semibold text-slate-900">{edu.institution}</span>
                            {edu.degree && <span className="text-slate-600"> — {edu.degree}</span>}
                            {edu.field && <span className="text-slate-500"> in {edu.field}</span>}
                          </div>
                          <span className="text-slate-500">
                            {edu.startDate} – {edu.endDate}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Projects */}
                {ast.projects && ast.projects.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">
                      Key Projects & Initiatives
                    </h3>
                    <div className="space-y-2.5">
                      {(ast.projects || []).map((proj: any, idx: number) => (
                        <div key={idx} className="text-xs">
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            {proj.name}
                            {proj.url && (
                              <span className="text-[11px] font-normal text-slate-400">({proj.url})</span>
                            )}
                          </div>
                          {proj.description && (
                            <p className="text-slate-600 mt-0.5">{proj.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ATS Scorecard & Audit */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              {breakdown ? (
                <>
                  {/* Category Breakdown Bars */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {breakdown.breakdown && (
                      <>
                        <Card className="glass border-border">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold flex items-center justify-between">
                              <span>Required Skills Alignment</span>
                              <span className="text-emerald-400 font-bold">
                                {breakdown.breakdown.requiredSkills.score}%
                              </span>
                            </CardTitle>
                            <CardDescription className="text-xs">
                              Weighted 35% of total ATS score
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all"
                                style={{ width: `${breakdown.breakdown.requiredSkills.score}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {breakdown.breakdown.requiredSkills.feedback}
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="glass border-border">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold flex items-center justify-between">
                              <span>Preferred Skills Alignment</span>
                              <span className="text-blue-400 font-bold">
                                {breakdown.breakdown.preferredSkills.score}%
                              </span>
                            </CardTitle>
                            <CardDescription className="text-xs">
                              Weighted 15% of total ATS score
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full transition-all"
                                style={{ width: `${breakdown.breakdown.preferredSkills.score}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {breakdown.breakdown.preferredSkills.feedback}
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="glass border-border">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold flex items-center justify-between">
                              <span>Experience & Seniority</span>
                              <span className="text-purple-400 font-bold">
                                {breakdown.breakdown.experienceAlignment.score}%
                              </span>
                            </CardTitle>
                            <CardDescription className="text-xs">
                              Weighted 20% of total ATS score
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-purple-500 rounded-full transition-all"
                                style={{ width: `${breakdown.breakdown.experienceAlignment.score}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {breakdown.breakdown.experienceAlignment.feedback}
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="glass border-border">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold flex items-center justify-between">
                              <span>Quantifiable Impact</span>
                              <span className="text-cyan-400 font-bold">
                                {breakdown.breakdown.quantifiableImpact.score}%
                              </span>
                            </CardTitle>
                            <CardDescription className="text-xs">
                              Weighted 15% of total ATS score
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-cyan-500 rounded-full transition-all"
                                style={{ width: `${breakdown.breakdown.quantifiableImpact.score}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {breakdown.breakdown.quantifiableImpact.feedback}
                            </p>
                          </CardContent>
                        </Card>
                      </>
                    )}
                  </div>

                  {/* Skills Breakdown Tags */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="glass border-emerald-500/20 bg-emerald-500/5">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                          <CheckCircle2 className="w-4 h-4" />
                          Matched Keywords ({breakdown.matchedSkills?.length || 0})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-1.5">
                          {(breakdown.matchedSkills || []).map((skill: string, idx: number) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs font-semibold bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                            >
                              {skill}
                            </Badge>
                          ))}
                          {(!breakdown.matchedSkills || breakdown.matchedSkills.length === 0) && (
                            <p className="text-xs text-muted-foreground">No matching keywords detected.</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="glass border-amber-500/20 bg-amber-500/5">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                          <AlertTriangle className="w-4 h-4" />
                          Missing Keywords ({breakdown.missingSkills?.length || 0})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-1.5">
                          {(breakdown.missingSkills || []).map((skill: string, idx: number) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs font-semibold bg-amber-500/15 text-amber-300 border-amber-500/30"
                            >
                              {skill}
                            </Badge>
                          ))}
                          {(!breakdown.missingSkills || breakdown.missingSkills.length === 0) && (
                            <p className="text-xs text-emerald-400">All required keywords are matched!</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recommendations */}
                  <Card className="glass border-border">
                    <CardHeader>
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        Targeted ATS Recommendations
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Actionable enhancements to achieve maximum interview shortlisting rate
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {(breakdown.recommendations || []).map((rec: string, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3.5 rounded-xl bg-background/60 border border-border/80"
                        >
                          <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                            {idx + 1}
                          </div>
                          <p className="text-xs text-foreground leading-relaxed">{rec}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground glass rounded-2xl">
                  No ATS breakdown data stored for this variant.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Diff & Lineage */}
          {activeTab === 'diff' && (
            <div className="space-y-6">
              {diff ? (
                <>
                  {/* Diff Overview KPI Card */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl glass border border-border">
                      <span className="text-xs text-muted-foreground block">ATS Delta</span>
                      <span
                        className={cn(
                          'text-xl font-bold block mt-1',
                          diff.atsScoreDelta >= 0 ? 'text-emerald-400' : 'text-destructive',
                        )}
                      >
                        {diff.atsScoreDelta >= 0 ? `+${diff.atsScoreDelta}%` : `${diff.atsScoreDelta}%`}
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl glass border border-border">
                      <span className="text-xs text-muted-foreground block">Skills Promoted to Core</span>
                      <span className="text-xl font-bold text-indigo-400 block mt-1">
                        {diff.skillsDiff?.promoted?.length || 0}
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl glass border border-border">
                      <span className="text-xs text-muted-foreground block">Skills Added</span>
                      <span className="text-xl font-bold text-emerald-400 block mt-1">
                        {diff.skillsDiff?.added?.length || 0}
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl glass border border-border">
                      <span className="text-xs text-muted-foreground block">Experience Roles Re-ranked</span>
                      <span className="text-xl font-bold text-foreground block mt-1">
                        {diff.experienceDiff?.length || 0}
                      </span>
                    </div>
                  </div>

                  {/* Summary Diff */}
                  {diff.summaryChanged && (
                    <Card className="glass border-border">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <FileText className="w-4 h-4 text-indigo-400" />
                          Professional Summary Synthesis
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-xs">
                        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive-foreground">
                          <span className="font-semibold text-[11px] block uppercase text-rose-400 mb-1">
                            Before (Base):
                          </span>
                          <p className="text-muted-foreground leading-relaxed">
                            {diff.summaryDiff.base || 'No summary was set.'}
                          </p>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                          <span className="font-semibold text-[11px] block uppercase text-emerald-400 mb-1">
                            After (Targeted):
                          </span>
                          <p className="text-foreground leading-relaxed">{diff.summaryDiff.tailored}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Skills Diff */}
                  <Card className="glass border-border">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Award className="w-4 h-4 text-purple-400" />
                        Skill Prioritization Changes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {diff.skillsDiff?.promoted?.length > 0 && (
                        <div>
                          <span className="text-xs font-semibold text-purple-400 block mb-1.5">
                            Promoted to Core Competencies (JD Keywords):
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {diff.skillsDiff.promoted.map((s: string, idx: number) => (
                              <Badge
                                key={idx}
                                className="bg-purple-500/15 text-purple-300 border-purple-500/30 text-xs"
                              >
                                ↑ {s}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {diff.skillsDiff?.added?.length > 0 && (
                        <div>
                          <span className="text-xs font-semibold text-emerald-400 block mb-1.5">
                            Newly Integrated from Evidence:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {diff.skillsDiff.added.map((s: string, idx: number) => (
                              <Badge
                                key={idx}
                                className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-xs"
                              >
                                + {s}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Experience Diff */}
                  {diff.experienceDiff && diff.experienceDiff.length > 0 && (
                    <Card className="glass border-border">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-blue-400" />
                          Experience Bullet Re-Ranking & Evidence Bindings
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Bullets ordered by impact metrics and target skill relevance
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {diff.experienceDiff.map((exp: any, idx: number) => (
                          <div key={idx} className="p-4 rounded-xl bg-background/50 border border-border/70 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-foreground">
                                {exp.role} @ {exp.company}
                              </span>
                              {exp.bulletsReordered && (
                                <Badge variant="secondary" className="text-[10px] bg-indigo-500/15 text-indigo-400">
                                  Re-ordered for Impact
                                </Badge>
                              )}
                            </div>
                            <ul className="list-disc list-outside pl-4 space-y-1 text-xs text-muted-foreground">
                              {exp.tailoredBullets.map((b: string, bIdx: number) => (
                                <li key={bIdx} className="leading-relaxed">
                                  {b}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground glass rounded-2xl">
                  No structural diff available for this resume version.
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
