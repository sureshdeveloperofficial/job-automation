'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { resumesApi, jobsApi, evidenceApi } from '@/lib/api';
import { AppSidebar } from '@/components/app-sidebar';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  Briefcase,
  ChevronRight,
  ShieldCheck,
  Download,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

function TailorStudioContent() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedJobId = searchParams.get('jobId');
  const preselectedBaseResumeId = searchParams.get('baseResumeId');

  // Studio State
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Data Options
  const [resumes, setResumes] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [evidenceList, setEvidenceList] = useState<any[]>([]);

  // Selections
  const [selectedResumeId, setSelectedResumeId] = useState<string>(preselectedBaseResumeId || '');
  const [selectedJobId, setSelectedJobId] = useState<string>(preselectedJobId || '');
  const [customJobDesc, setCustomJobDesc] = useState<string>('');
  const [targetTitle, setTargetTitle] = useState<string>('');
  const [targetCompany, setTargetCompany] = useState<string>('');
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<string[]>([]);
  const [templateStyle, setTemplateStyle] = useState<'MODERN' | 'CLASSIC' | 'MINIMAL'>('MODERN');

  // Results
  const [preScore, setPreScore] = useState<any | null>(null);
  const [tailorResult, setTailorResult] = useState<any | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Load initial options
  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        const [resumesRes, jobsRes, evidenceRes] = await Promise.all([
          resumesApi.listResumes(),
          jobsApi.searchJobs({ pageSize: 15 }),
          evidenceApi.getEvidence({ status: 'VERIFIED' }),
        ]);

        if (resumesRes?.data) {
          setResumes(resumesRes.data);
          if (!selectedResumeId && resumesRes.data.length > 0) {
            setSelectedResumeId(resumesRes.data[0].id);
          }
        }
        if (jobsRes?.data?.jobs) {
          setJobs(jobsRes.data.jobs);
        }
        if (evidenceRes?.data?.items) {
          setEvidenceList(evidenceRes.data.items);
          setSelectedEvidenceIds(evidenceRes.data.items.slice(0, 3).map((e: any) => e.id));
        }

        // If preselected jobId was provided, resolve job details
        if (preselectedJobId) {
          const singleJob = await jobsApi.getJobById(preselectedJobId);
          if (singleJob?.data) {
            setSelectedJobId(singleJob.data.id);
            setTargetTitle(singleJob.data.title);
            setTargetCompany(singleJob.data.company?.name || '');
          }
        }
      } catch (err) {
        console.error('Failed to initialize tailoring studio:', err);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      initData();
    }
  }, [isAuthenticated, preselectedJobId, preselectedBaseResumeId, selectedResumeId]);

  // Step 2 Trigger: Calculate Pre-Score
  const handleProceedToStep2 = async () => {
    if (!selectedResumeId) return;
    try {
      setGenerating(true);
      const scorePayload: any = {};
      if (selectedJobId) {
        scorePayload.jobId = selectedJobId;
      } else {
        scorePayload.customJobDescription = customJobDesc;
        scorePayload.targetRoleTitle = targetTitle || 'Software Engineer';
        scorePayload.targetCompanyName = targetCompany || 'Target Employer';
      }

      const res = await resumesApi.scoreResume(selectedResumeId, scorePayload);
      if (res?.data) {
        setPreScore(res.data);
        setStep(2);
      }
    } catch (err) {
      console.error('Failed to score resume:', err);
    } finally {
      setGenerating(false);
    }
  };

  // Step 4 Trigger: Execute Tailoring
  const handleGenerateTailored = async () => {
    if (!selectedResumeId) return;
    try {
      setGenerating(true);
      const tailorPayload: any = {
        templateStyle,
        selectedEvidenceIds,
      };

      if (selectedJobId) {
        tailorPayload.jobId = selectedJobId;
      } else {
        tailorPayload.customJobDescription = customJobDesc;
        tailorPayload.targetRoleTitle = targetTitle;
        tailorPayload.targetCompanyName = targetCompany;
      }

      const res = await resumesApi.tailorResume(selectedResumeId, tailorPayload);
      if (res?.data) {
        setTailorResult(res.data);
        setStep(4);
      }
    } catch (err) {
      console.error('Tailoring failed:', err);
    } finally {
      setGenerating(false);
    }
  };

  const toggleEvidence = (id: string) => {
    setSelectedEvidenceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  return (
    <div className="min-h-screen flex bg-background">
      <AppSidebar />

      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-border flex items-center justify-between px-6 flex-shrink-0 bg-card/20 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Link
              href="/resumes"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Resume Hub
            </Link>
            <span className="text-muted-foreground">•</span>
            <div>
              <h1 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                Resume Tailoring Studio
              </h1>
            </div>
          </div>

          {/* Stepper Progress */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold">
            <span className={cn('px-2.5 py-1 rounded-full', step === 1 ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground')}>
              1. Job Match
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            <span className={cn('px-2.5 py-1 rounded-full', step === 2 ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground')}>
              2. Gap Analysis
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            <span className={cn('px-2.5 py-1 rounded-full', step === 3 ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground')}>
              3. Evidence Claims
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            <span className={cn('px-2.5 py-1 rounded-full', step === 4 ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground')}>
              4. Diff & Export
            </span>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full space-y-6">
          {/* STEP 1: Choose Base Resume & Target Job */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-foreground">Select Base Resume & Target Opportunity</h2>
                <p className="text-xs text-muted-foreground">
                  AI Career OS strictly derives all bullets from your verified profile—guaranteeing 100% truthfulness.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Select Base Resume */}
                <Card className="glass border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-400" />
                      1. Master Base Resume
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Choose the verified master resume to tailor from
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {loading && (
                      <p className="text-xs text-muted-foreground animate-pulse">Loading master resumes...</p>
                    )}
                    {resumes.map((r) => (
                      <div
                        key={r.id}
                        onClick={() => setSelectedResumeId(r.id)}
                        className={cn(
                          'p-3.5 rounded-xl border cursor-pointer transition-all text-xs space-y-1',
                          selectedResumeId === r.id
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-border/80 bg-background/50 hover:border-border',
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">{r.name}</span>
                          {selectedResumeId === r.id && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                        </div>
                        <span className="text-muted-foreground block text-[11px]">
                          Uploaded {new Date(r.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Select Target Job */}
                <Card className="glass border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-indigo-400" />
                      2. Target Opportunity
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Select from your Job Radar or paste custom specifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {jobs.slice(0, 4).map((j) => (
                      <div
                        key={j.id}
                        onClick={() => {
                          setSelectedJobId(j.id);
                          setTargetTitle(j.title);
                          setTargetCompany(j.company?.name || '');
                        }}
                        className={cn(
                          'p-3.5 rounded-xl border cursor-pointer transition-all text-xs space-y-1',
                          selectedJobId === j.id
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-border/80 bg-background/50 hover:border-border',
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground line-clamp-1">{j.title}</span>
                          {selectedJobId === j.id && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                        </div>
                        <span className="text-muted-foreground block text-[11px]">
                          {j.company?.name} • {j.location || 'Remote'}
                        </span>
                      </div>
                    ))}

                    <div className="pt-2">
                      <span className="text-[11px] text-muted-foreground block mb-2 font-medium">Or paste custom JD:</span>
                      <Textarea
                        placeholder="Paste target job requirements / responsibilities here..."
                        value={customJobDesc}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                          setCustomJobDesc(e.target.value);
                          setSelectedJobId('');
                        }}
                        rows={3}
                        className="text-xs bg-background/60"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleProceedToStep2}
                  disabled={generating || !selectedResumeId || (!selectedJobId && !customJobDesc)}
                  className="bg-blue-600 hover:bg-blue-500 gap-1.5 font-semibold text-xs h-10 px-6 shadow-lg shadow-blue-500/20"
                >
                  {generating ? 'Analyzing Compatibility...' : 'Analyze Match & Gap ->'}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Instant ATS Pre-Score & Gap Analysis */}
          {step === 2 && preScore && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-foreground">Baseline ATS Match & Gap Analysis</h2>
                <p className="text-xs text-muted-foreground">
                  Current alignment score before tailoring. Tailoring will re-order bullets, promote skills, and close gaps.
                </p>
              </div>

              {/* Score Gauge Banner */}
              <div className="glass rounded-3xl p-6 border border-border flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                    Current Baseline ATS Score
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl font-black text-amber-400">{preScore.score}%</span>
                    <span className="text-xs text-muted-foreground">/ 100% Target Compatibility</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Projected after evidence alignment: <span className="text-emerald-400 font-bold">88–95%</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-background/50 border border-border">
                    <span className="text-muted-foreground block text-[10px]">Required Skills</span>
                    <span className="font-bold text-foreground">{preScore.breakdown.requiredSkills.score}%</span>
                  </div>
                  <div className="p-3 rounded-xl bg-background/50 border border-border">
                    <span className="text-muted-foreground block text-[10px]">Impact Metrics</span>
                    <span className="font-bold text-foreground">{preScore.breakdown.quantifiableImpact.score}%</span>
                  </div>
                </div>
              </div>

              {/* Skills Overlap & Missing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="glass border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Matched Required Skills ({preScore.breakdown.requiredSkills.matched.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1.5">
                      {preScore.breakdown.requiredSkills.matched.map((s: string) => (
                        <Badge key={s} variant="secondary" className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-amber-400 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      Missing Required Skills ({preScore.breakdown.requiredSkills.missing.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1.5">
                      {preScore.breakdown.requiredSkills.missing.map((s: string) => (
                        <Badge key={s} variant="outline" className="border-amber-500/30 text-amber-400 text-xs">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex items-center justify-between pt-4">
                <Button size="sm" variant="outline" onClick={() => setStep(1)} className="text-xs gap-1.5">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </Button>
                <Button
                  size="sm"
                  onClick={() => setStep(3)}
                  className="bg-blue-600 hover:bg-blue-500 text-xs font-semibold px-6 h-10 gap-1.5"
                >
                  Configure Evidence Claims <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Evidence Selection & Bullet Alignment */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-foreground">Select Verified Evidence Claims</h2>
                <p className="text-xs text-muted-foreground">
                  Only claims verified in your Evidence Ledger will be emphasized and re-ordered in the tailored resume.
                </p>
              </div>

              {/* Evidence Claims List */}
              <div className="space-y-3">
                {evidenceList.map((item) => {
                  const isSelected = selectedEvidenceIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleEvidence(item.id)}
                      className={cn(
                        'p-4 rounded-2xl border cursor-pointer transition-all text-xs space-y-2',
                        isSelected
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-border/80 bg-background/50 hover:border-border',
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 flex-1">
                          <p className="font-semibold text-foreground text-sm">{item.claim}</p>
                          <p className="text-muted-foreground text-[11px]">{item.context}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/5 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            Verified Proof
                          </Badge>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                        <span>Source: {item.sourceDetail || 'Resume Parser'}</span>
                        <span>•</span>
                        <span>Category: {item.category}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Template Style Selector */}
              <div className="p-4 rounded-2xl bg-card/40 border border-border space-y-3">
                <span className="text-xs font-semibold text-foreground block">ATS Document Template Style</span>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  {(['MODERN', 'CLASSIC', 'MINIMAL'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTemplateStyle(t)}
                      className={cn(
                        'p-3 rounded-xl border text-center font-semibold transition-all',
                        templateStyle === t
                          ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                          : 'border-border/80 text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {t.charAt(0) + t.slice(1).toLowerCase()} Tech
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <Button size="sm" variant="outline" onClick={() => setStep(2)} className="text-xs gap-1.5">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </Button>
                <Button
                  size="sm"
                  onClick={handleGenerateTailored}
                  disabled={generating}
                  className="bg-blue-600 hover:bg-blue-500 text-xs font-semibold px-6 h-10 shadow-lg shadow-blue-500/20 gap-1.5"
                >
                  {generating ? (
                    'Tailoring & Diffing Resume...'
                  ) : (
                    <>
                      Generate Evidence-Backed Resume <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: Live Side-by-Side Diff & Final ATS Score Verification */}
          {step === 4 && tailorResult && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-foreground">Tailored Resume & Visual Diff Inspector</h2>
                <p className="text-xs text-muted-foreground">
                  Verified evidence claims bound, skills promoted, and bullet points re-ordered for target role.
                </p>
              </div>

              {/* Score Improvement Banner */}
              <div className="glass rounded-3xl p-6 border border-emerald-500/30 bg-emerald-500/5 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
                    Tailored ATS Score
                  </span>
                  <div className="flex items-baseline gap-3 mt-1">
                    <span className="text-4xl font-black text-emerald-400">{tailorResult.atsScoreAfter}%</span>
                    <span className="text-xs text-emerald-300 font-semibold">
                      (+{tailorResult.atsScoreAfter - tailorResult.atsScoreBefore}% Improvement)
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {tailorResult.evidenceBindings.length} verified claims bound to bullet points
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={`http://localhost:1961/api/v1/resumes/variants/${tailorResult.version.id}/export?format=html`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-xs font-semibold gap-1.5 h-9">
                      <Download className="w-3.5 h-3.5" />
                      Download ATS PDF/HTML
                    </Button>
                  </a>
                  <Link href={`/resumes/${tailorResult.version.id}`}>
                    <Button size="sm" variant="outline" className="text-xs font-semibold h-9">
                      View Full Audit
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Diff Highlights Breakdown */}
              <Card className="glass border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Optimization Diff Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-background/50 border border-border">
                      <span className="text-muted-foreground block text-[10px]">Promoted Core Skills</span>
                      <span className="font-bold text-emerald-400 mt-1 block">
                        {tailorResult.diffSummary.addedSkills.join(', ') || 'Optimized'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-background/50 border border-border">
                      <span className="text-muted-foreground block text-[10px]">Re-Ranked Experience Bullets</span>
                      <span className="font-bold text-indigo-400 mt-1 block">
                        {tailorResult.diffSummary.reorderedBulletsCount} company sections prioritized
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-background/50 border border-border">
                      <span className="text-muted-foreground block text-[10px]">Verified Evidence Claims Bound</span>
                      <span className="font-bold text-blue-400 mt-1 block">
                        {tailorResult.evidenceBindings.length} claims
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Preview Document Box */}
              <Card className="glass border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">ATS-Ready Document Preview</CardTitle>
                  <CardDescription className="text-xs">
                    Rendered in clean, standard semantic HTML/CSS compatible with all recruiting parsers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-6 rounded-2xl bg-white text-slate-900 shadow-xl max-h-[500px] overflow-y-auto font-sans text-xs space-y-4">
                    <div className="border-b pb-3 text-center">
                      <h3 className="text-xl font-bold">{tailorResult.tailoredResume.personalInfo.fullName}</h3>
                      <p className="text-slate-600 font-medium">{tailorResult.tailoredResume.personalInfo.headline}</p>
                      <p className="text-slate-500 text-[11px] mt-1">
                        {tailorResult.tailoredResume.personalInfo.email} • {tailorResult.tailoredResume.personalInfo.location}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold uppercase tracking-wider text-blue-800 text-[11px] border-b pb-1 mb-1">
                        Professional Summary
                      </h4>
                      <p className="text-slate-700 leading-relaxed">{tailorResult.tailoredResume.summary}</p>
                    </div>

                    <div>
                      <h4 className="font-bold uppercase tracking-wider text-blue-800 text-[11px] border-b pb-1 mb-1">
                        Core Competencies
                      </h4>
                      <p className="text-slate-700 font-medium">
                        {tailorResult.tailoredResume.skills.core.join(' • ')}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold uppercase tracking-wider text-blue-800 text-[11px] border-b pb-1 mb-1">
                        Experience
                      </h4>
                      <div className="space-y-3">
                        {tailorResult.tailoredResume.experiences.map((exp: any, i: number) => (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between font-bold text-slate-800">
                              <span>{exp.role} | {exp.company}</span>
                              <span className="text-slate-500 font-normal">{exp.startDate} – {exp.current ? 'Present' : exp.endDate}</span>
                            </div>
                            <ul className="list-disc ml-4 text-slate-700 space-y-0.5">
                              {exp.bullets.map((b: any, j: number) => (
                                <li key={j}>{typeof b === 'string' ? b : b.text}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between pt-4">
                <Link href="/resumes">
                  <Button size="sm" variant="outline" className="text-xs gap-1.5">
                    <ArrowLeft className="w-3.5 h-3.5" /> Return to Resume Hub
                  </Button>
                </Link>
                <Link href={`/resumes/${tailorResult.version.id}`}>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-xs font-semibold px-6 h-10 gap-1.5">
                    Open Variant & Full Audit Inspector <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function TailorStudioPage() {
  return (
    <Suspense fallback={<div>Loading Studio...</div>}>
      <TailorStudioContent />
    </Suspense>
  );
}
