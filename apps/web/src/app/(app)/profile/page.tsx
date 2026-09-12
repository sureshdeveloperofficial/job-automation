'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { profileApi } from '@/lib/api';
import {
  ShieldCheck,
  Save,
  CheckCircle,
  AlertCircle,
  Plus,
  Loader2,
  ChevronRight,
  Sliders,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ProfilePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [profile, setProfile] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'experience' | 'skills' | 'preferences'>('overview');
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await profileApi.getProfile();
      if (res?.data) {
        setProfile(res.data);
        setHealth(res.data.health);
      }
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setErrorMessage(null);
    try {
      const res = await profileApi.updateProfile({
        title: profile.title,
        phone: profile.phone,
        location: profile.location,
        linkedinUrl: profile.linkedinUrl,
        githubUrl: profile.githubUrl,
        portfolioUrl: profile.portfolioUrl,
        yearsOfExperience: Number(profile.yearsOfExperience || 0),
        noticePeriodDays: Number(profile.noticePeriodDays || 0),
        expectedSalaryMin: Number(profile.expectedSalaryMin || 0),
        expectedSalaryMax: Number(profile.expectedSalaryMax || 0),
        salaryCurrency: profile.salaryCurrency || 'USD',
        workModes: profile.workModes,
        skills: profile.skills,
        experiences: profile.experiences,
        education: profile.education,
      });
      if (res?.data) {
        setProfile(res.data);
        setHealth(res.data.health);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || 'Failed to save profile changes');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    const current = profile.skills || [];
    if (!current.includes(newSkill.trim())) {
      setProfile({ ...profile, skills: [...current, newSkill.trim()] });
    }
    setNewSkill('');
  };

  const handleRemoveSkill = (skill: string) => {
    setProfile({
      ...profile,
      skills: (profile.skills || []).filter((s: string) => s !== skill),
    });
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  const score = health?.score ?? profile?.profileHealthScore ?? 0;

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top bar with Breadcrumbs & Save button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-foreground">Candidate Profile</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Candidate Profile & Health Score</h1>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/profile/evidence">
              <Button variant="outline" size="sm">
                <ShieldCheck className="w-4 h-4 mr-1.5 text-emerald-400" />
                Evidence Ledger
              </Button>
            </Link>
            <Link href="/role-profiles">
              <Button variant="outline" size="sm">
                <Sliders className="w-4 h-4 mr-1.5 text-blue-400" />
                Role Targets
              </Button>
            </Link>
            <Button
              onClick={handleSaveProfile}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-500"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Profile
            </Button>
          </div>
        </div>

        {saveSuccess && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            Profile updated successfully and Health Score recalculated!
          </div>
        )}
        {errorMessage && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {errorMessage}
          </div>
        )}

        {/* Health Score Overview Card */}
        <Card className="glass border-border">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-muted/30"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={
                        score >= 80
                          ? 'text-emerald-400'
                          : score >= 50
                          ? 'text-amber-400'
                          : 'text-blue-400'
                      }
                      strokeDasharray={`${score}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-bold tracking-tight">{score}%</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Health</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">Candidate Profile Health Score</h3>
                    <Badge variant="outline" className={score >= 80 ? 'text-emerald-400 border-emerald-500/30' : 'text-blue-400'}>
                      {score >= 80 ? 'Ready for Tailoring' : 'Needs Verification'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground max-w-lg">
                    Based on verified contact credentials, structured work history, technical skills inventory, and verified claims in your Evidence Ledger.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 w-full md:w-auto">
                <div className="p-2.5 rounded-lg border border-border bg-muted/15 text-center">
                  <div className="text-sm font-semibold">{health?.breakdown?.personalInfo ?? 0}/20</div>
                  <div className="text-[10px] text-muted-foreground">Personal</div>
                </div>
                <div className="p-2.5 rounded-lg border border-border bg-muted/15 text-center">
                  <div className="text-sm font-semibold">{health?.breakdown?.experience ?? 0}/25</div>
                  <div className="text-[10px] text-muted-foreground">Experience</div>
                </div>
                <div className="p-2.5 rounded-lg border border-border bg-muted/15 text-center">
                  <div className="text-sm font-semibold">{health?.breakdown?.skills ?? 0}/20</div>
                  <div className="text-[10px] text-muted-foreground">Skills</div>
                </div>
                <div className="p-2.5 rounded-lg border border-border bg-muted/15 text-center">
                  <div className="text-sm font-semibold">{health?.breakdown?.education ?? 0}/15</div>
                  <div className="text-[10px] text-muted-foreground">Education</div>
                </div>
                <div className="p-2.5 rounded-lg border border-border bg-muted/15 text-center">
                  <div className="text-sm font-semibold">{health?.breakdown?.evidence ?? 0}/20</div>
                  <div className="text-[10px] text-muted-foreground">Evidence</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tab Navigation */}
        <div className="flex border-b border-border space-x-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Personal & Contact
          </button>
          <button
            onClick={() => setActiveTab('experience')}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'experience'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Work Experience
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'skills'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Skills Matrix
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'preferences'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Job Preferences
          </button>
        </div>

        {/* TAB 1: Personal & Contact */}
        {activeTab === 'overview' && (
          <Card className="glass border-border">
            <CardHeader>
              <CardTitle className="text-lg">Personal Information & Recruiter Links</CardTitle>
              <CardDescription>Keep contact details updated so recruiters and ATS portals ingest correct information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="prof-title">Headline / Target Title</Label>
                  <Input
                    id="prof-title"
                    value={profile.title || ''}
                    onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prof-loc">Location</Label>
                  <Input
                    id="prof-loc"
                    value={profile.location || ''}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prof-phone">Phone Number</Label>
                  <Input
                    id="prof-phone"
                    value={profile.phone || ''}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prof-linkedin">LinkedIn URL</Label>
                  <Input
                    id="prof-linkedin"
                    value={profile.linkedinUrl || ''}
                    onChange={(e) => setProfile({ ...profile, linkedinUrl: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prof-github">GitHub URL</Label>
                  <Input
                    id="prof-github"
                    value={profile.githubUrl || ''}
                    onChange={(e) => setProfile({ ...profile, githubUrl: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="prof-summary">Professional Summary</Label>
                  <textarea
                    id="prof-summary"
                    rows={4}
                    className="w-full rounded-md border border-border bg-background p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={profile.summary || ''}
                    onChange={(e) => setProfile({ ...profile, summary: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* TAB 2: Work Experience */}
        {activeTab === 'experience' && (
          <div className="space-y-4">
            {(profile.experiences || []).map((exp: any, idx: number) => (
              <Card key={idx} className="glass border-border">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-base">{exp.title}</h4>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <span>{exp.company}</span>
                        <span>•</span>
                        <span>{exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    {(exp.bullets || []).map((b: string, bIdx: number) => (
                      <div key={bIdx} className="flex gap-2">
                        <span>•</span>
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* TAB 3: Skills Matrix */}
        {activeTab === 'skills' && (
          <Card className="glass border-border">
            <CardHeader>
              <CardTitle className="text-lg">Technical Skills Inventory</CardTitle>
              <CardDescription>Verified competencies used to rank job matches and detect skill gaps.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add skill (e.g. AWS, Redis, GraphQL)"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                />
                <Button onClick={handleAddSkill}>
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {(profile.skills || []).map((s: string) => (
                  <Badge key={s} variant="secondary" className="px-3 py-1 flex items-center gap-2">
                    <span>{s}</span>
                    <button
                      onClick={() => handleRemoveSkill(s)}
                      className="hover:text-red-400"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* TAB 4: Preferences */}
        {activeTab === 'preferences' && (
          <Card className="glass border-border">
            <CardHeader>
              <CardTitle className="text-lg">Job Search Preferences</CardTitle>
              <CardDescription>Set compensation floors and work modes for automated matching.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Minimum Salary ({profile.salaryCurrency || 'USD'})</Label>
                  <Input
                    type="number"
                    value={profile.expectedSalaryMin || ''}
                    onChange={(e) => setProfile({ ...profile, expectedSalaryMin: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notice Period (Days)</Label>
                  <Input
                    type="number"
                    value={profile.noticePeriodDays || ''}
                    onChange={(e) => setProfile({ ...profile, noticePeriodDays: Number(e.target.value) })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
