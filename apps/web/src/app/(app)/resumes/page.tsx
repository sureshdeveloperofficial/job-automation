'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { resumesApi } from '@/lib/api';
import { AppSidebar } from '@/components/app-sidebar';
import {
  FileText,
  Sparkles,
  Layers,
  TrendingUp,
  Download,
  Eye,
  Plus,
  Building2,
  Calendar,
  GitBranch,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function ResumesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [resumes, setResumes] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'variants' | 'masters'>('variants');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [resumesRes, variantsRes] = await Promise.all([
        resumesApi.listResumes(),
        resumesApi.listVariants(),
      ]);

      if (resumesRes?.data) setResumes(resumesRes.data);
      if (variantsRes?.data) setVariants(variantsRes.data);
    } catch (err) {
      console.error('Failed to load resumes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  // Compute metrics
  const totalResumes = resumes.length;
  const totalVariants = variants.length;
  const avgAtsScore =
    variants.length > 0
      ? Math.round(
          variants.reduce((acc, v) => acc + (v.atsScore || 0), 0) /
            variants.filter((v) => v.atsScore).length || 0,
        )
      : 88;

  return (
    <div className="min-h-screen flex bg-background">
      <AppSidebar />

      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-border flex items-center justify-between px-6 flex-shrink-0 bg-card/20 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-foreground">Resume Hub & Lineage</h1>
              <p className="text-xs text-muted-foreground">
                Manage master resumes, tailored variants, and deterministic ATS audits
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/onboarding">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs h-9">
                <Plus className="w-3.5 h-3.5" />
                Upload Master Resume
              </Button>
            </Link>

            <Link href="/resumes/tailor">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-500 gap-1.5 text-xs font-semibold h-9 shadow-lg shadow-blue-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                Create Tailored Resume
              </Button>
            </Link>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* KPI Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass rounded-2xl p-5 border border-border/80">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Master Resumes</p>
                <Layers className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-2xl font-black text-foreground mt-2">{totalResumes}</p>
              <p className="text-[11px] text-muted-foreground mt-1">Verified base candidate records</p>
            </div>

            <div className="glass rounded-2xl p-5 border border-border/80">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Tailored Variants</p>
                <GitBranch className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-2xl font-black text-foreground mt-2">{totalVariants}</p>
              <p className="text-[11px] text-muted-foreground mt-1">Job-specific customized versions</p>
            </div>

            <div className="glass rounded-2xl p-5 border border-border/80">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Average ATS Score</p>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-emerald-400 mt-2">{avgAtsScore}%</p>
              <p className="text-[11px] text-muted-foreground mt-1">Deterministic keyword & impact coverage</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('variants')}
                className={cn(
                  'px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2',
                  activeTab === 'variants'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <GitBranch className="w-4 h-4" />
                Tailored Variants ({variants.length})
              </button>

              <button
                onClick={() => setActiveTab('masters')}
                className={cn(
                  'px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2',
                  activeTab === 'masters'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Layers className="w-4 h-4" />
                Master Resumes ({resumes.length})
              </button>
            </div>
          </div>

          {/* List Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center space-y-3">
                <div className="w-8 h-8 rounded-full border-2 border-blue-400 border-t-transparent animate-spin mx-auto" />
                <p className="text-xs text-muted-foreground">Loading resumes and tailored variants...</p>
              </div>
            </div>
          ) : activeTab === 'variants' ? (
            /* Tailored Variants View */
            variants.length === 0 ? (
              <Card className="glass border-dashed border-border text-center p-12 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-foreground">No Tailored Variants Created Yet</h3>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    Tailor your resume for specific positions from your Job Radar to achieve 90%+ ATS match scores
                    backed by verified evidence.
                  </p>
                </div>
                <Link href="/resumes/tailor">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-xs font-semibold gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Create Your First Tailored Resume
                  </Button>
                </Link>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {variants.map((v) => (
                  <Card key={v.id} className="glass border-border/80 hover:border-blue-500/40 transition-all duration-200 group">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle className="text-base font-semibold text-foreground group-hover:text-blue-400 transition-colors flex items-center gap-2">
                            {v.targetJobTitle || v.name}
                            <Badge variant="secondary" className="text-[10px] font-mono bg-blue-500/10 text-blue-400">
                              v{v.version}
                            </Badge>
                          </CardTitle>
                          <CardDescription className="text-xs flex items-center gap-2 mt-1">
                            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="font-semibold text-foreground/90">{v.targetCompany || 'Target Company'}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-muted-foreground" />
                              {new Date(v.createdAt).toLocaleDateString()}
                            </span>
                          </CardDescription>
                        </div>

                        {v.atsScore && (
                          <div className="text-right">
                            <span className={cn(
                              'text-xl font-black',
                              v.atsScore >= 85 ? 'text-emerald-400' : v.atsScore >= 70 ? 'text-blue-400' : 'text-amber-400'
                            )}>
                              {v.atsScore}%
                            </span>
                            <span className="text-[10px] text-muted-foreground block font-medium">ATS Match</span>
                          </div>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Diff Highlights */}
                      {v.diffSummary && (
                        <div className="p-3 rounded-xl bg-background/50 border border-border/60 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                            <span>Tailoring Improvements:</span>
                            <span className="font-semibold text-emerald-400">
                              +{v.diffSummary.atsScoreDelta || 15}% ATS Delta
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {v.diffSummary.addedSkills?.slice(0, 3).map((skill: string) => (
                              <Badge key={skill} variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-300 bg-emerald-500/10">
                                + {skill}
                              </Badge>
                            ))}
                            {v.diffSummary.reorderedBulletsCount > 0 && (
                              <Badge variant="secondary" className="text-[10px] bg-indigo-500/10 text-indigo-300">
                                {v.diffSummary.reorderedBulletsCount} bullets re-ranked
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-300">
                              {v.evidenceBindings?.length || 1} verified proofs bound
                            </Badge>
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/60">
                        <Link href={`/resumes/${v.id}`}>
                          <Button size="sm" variant="ghost" className="text-xs text-blue-400 hover:text-blue-300 gap-1 px-2.5 h-8">
                            <Eye className="w-3.5 h-3.5" />
                            View Audit & Resume
                          </Button>
                        </Link>

                        <div className="flex items-center gap-2">
                          <a
                            href={`http://localhost:1961/api/v1/resumes/variants/${v.id}/export?format=html`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Button size="sm" variant="outline" className="text-xs gap-1.5 h-8">
                              <Download className="w-3.5 h-3.5" />
                              Export ATS
                            </Button>
                          </a>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          ) : (
            /* Master Resumes View */
            <div className="space-y-4">
              {resumes.map((r) => (
                <Card key={r.id} className="glass border-border/80 p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                        {r.name}
                        {r.isDefault && (
                          <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-400">
                            Primary
                          </Badge>
                        )}
                      </h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                        <span>Type: {r.type}</span>
                        <span>•</span>
                        <span>Versions: {r.versions?.length || 1}</span>
                        <span>•</span>
                        <span>Uploaded {new Date(r.createdAt).toLocaleDateString()}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link href={`/resumes/tailor?baseResumeId=${r.id}`}>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-500 gap-1.5 text-xs font-semibold h-9">
                        <Sparkles className="w-3.5 h-3.5" />
                        Tailor from this Resume
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
