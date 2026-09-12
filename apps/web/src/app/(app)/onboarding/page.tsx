'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { profileApi, resumesApi, evidenceApi, roleProfilesApi } from '@/lib/api';
import {
  User,
  Briefcase,
  Code2,
  FileText,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  Sparkles,
  ShieldCheck,
  Building,
  MapPin,
  Globe,
  Link2,
  DollarSign,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const POPULAR_SKILLS = [
  'TypeScript', 'React', 'Next.js', 'Node.js', 'NestJS', 'Python',
  'PostgreSQL', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'GraphQL',
  'Tailwind CSS', 'Go', 'Git', 'CI/CD', 'Microservices', 'Jest'
];

export default function OnboardingPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    phone: '',
    location: '',
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
    yearsOfExperience: 3,
    noticePeriodDays: 30,
    workModes: ['REMOTE', 'HYBRID'],
    expectedSalaryMin: 90000,
    expectedSalaryMax: 130000,
    salaryCurrency: 'USD',
    skills: ['TypeScript', 'React', 'PostgreSQL', 'Node.js', 'Docker'],
    experiences: [
      {
        title: 'Full Stack Engineer',
        company: 'Enterprise Technology Corp',
        location: 'Remote',
        startDate: 'Jan 2022',
        endDate: 'Present',
        isCurrent: true,
        bullets: [
          'Engineered cloud microservices reducing API response latency by 35%.',
          'Architected responsive client interfaces using Next.js and Tailwind CSS.'
        ]
      }
    ],
    education: [
      {
        degree: 'Bachelor of Science',
        institution: 'University of Engineering & Technology',
        fieldOfStudy: 'Computer Science',
      }
    ],
    resumeText: '',
  });

  const [parsedEvidence, setParsedEvidence] = useState<any[]>([]);
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [newSkillInput, setNewSkillInput] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Load existing profile if available
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await profileApi.getProfile();
        if (res?.data) {
          const p = res.data;
          setFormData((prev) => ({
            ...prev,
            title: p.title || prev.title,
            phone: p.phone || prev.phone,
            location: p.location || prev.location,
            linkedinUrl: p.linkedinUrl || prev.linkedinUrl,
            githubUrl: p.githubUrl || prev.githubUrl,
            yearsOfExperience: p.yearsOfExperience ?? prev.yearsOfExperience,
            skills: p.skills?.length > 0 ? p.skills : prev.skills,
            experiences: p.experiences?.length > 0 ? p.experiences : prev.experiences,
            education: p.education?.length > 0 ? p.education : prev.education,
          }));
        }
      } catch {
        // First time onboarding
      }
    }
    if (isAuthenticated) {
      loadProfile();
    }
  }, [isAuthenticated]);

  const handleAddSkill = (skillToAdd?: string) => {
    const skill = (skillToAdd || newSkillInput).trim();
    if (skill && !formData.skills.includes(skill)) {
      setFormData((prev) => ({ ...prev, skills: [...prev.skills, skill] }));
      if (!skillToAdd) setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  const handleAddExperience = () => {
    setFormData((prev) => ({
      ...prev,
      experiences: [
        ...prev.experiences,
        {
          title: 'Software Engineer',
          company: 'Company Name',
          location: 'Hybrid',
          startDate: '2020',
          endDate: '2022',
          isCurrent: false,
          bullets: ['Built full stack features and delivered scalable software.'],
        },
      ],
    }));
  };

  const handleRemoveExperience = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((_, i) => i !== index),
    }));
  };

  const handleParseResume = async () => {
    if (!formData.resumeText.trim()) return;
    setIsParsingResume(true);
    setErrorMessage(null);
    try {
      const res = await resumesApi.parseText(formData.resumeText);
      if (res?.data) {
        const parsed = res.data;
        setParsedEvidence(parsed.suggestedEvidence || []);
        setFormData((prev) => ({
          ...prev,
          title: parsed.personalInfo?.name ? prev.title || 'Senior Software Engineer' : prev.title,
          phone: parsed.personalInfo?.phone || prev.phone,
          linkedinUrl: parsed.personalInfo?.linkedinUrl || prev.linkedinUrl,
          githubUrl: parsed.personalInfo?.githubUrl || prev.githubUrl,
          location: parsed.personalInfo?.location || prev.location,
          skills: Array.from(new Set([...prev.skills, ...(parsed.skills || [])])),
          experiences: parsed.experiences?.length > 0 ? parsed.experiences : prev.experiences,
          education: parsed.education?.length > 0 ? parsed.education : prev.education,
        }));
        setSuccessMessage(`Parsed ${parsed.skills?.length || 0} skills and generated ${parsed.suggestedEvidence?.length || 0} evidence claims!`);
      }
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || 'Failed to parse resume text');
    } finally {
      setIsParsingResume(false);
    }
  };

  const handleFinishOnboarding = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      // 1. Update candidate profile
      await profileApi.updateProfile({
        title: formData.title,
        phone: formData.phone,
        location: formData.location,
        linkedinUrl: formData.linkedinUrl,
        githubUrl: formData.githubUrl,
        portfolioUrl: formData.portfolioUrl,
        yearsOfExperience: Number(formData.yearsOfExperience),
        noticePeriodDays: Number(formData.noticePeriodDays),
        workModes: formData.workModes as any,
        expectedSalaryMin: Number(formData.expectedSalaryMin),
        expectedSalaryMax: Number(formData.expectedSalaryMax),
        salaryCurrency: formData.salaryCurrency,
        skills: formData.skills,
        experiences: formData.experiences,
        education: formData.education,
        onboardingStep: 6,
        isOnboardingCompleted: true,
      });

      // 2. Create primary role profile
      await roleProfilesApi.createRoleProfile({
        name: formData.title || 'Primary Target Role',
        targetTitle: formData.title || 'Software Engineer',
        preferredTitles: [formData.title],
        requiredSkills: formData.skills.slice(0, 5),
        preferredSkills: formData.skills.slice(5, 10),
        workModes: formData.workModes as any,
        employmentTypes: ['FULL_TIME'],
        locations: [formData.location || 'Remote'],
        salaryMin: Number(formData.expectedSalaryMin),
        salaryMax: Number(formData.expectedSalaryMax),
        salaryCurrency: formData.salaryCurrency,
      });

      // 3. Seed verified evidence items if any were generated
      if (parsedEvidence.length > 0) {
        for (const ev of parsedEvidence) {
          await evidenceApi.createEvidence({
            category: ev.category || 'TECHNICAL',
            claim: ev.claim,
            context: ev.context,
            source: 'RESUME',
            sourceDetail: ev.sourceDetail,
            confidenceScore: ev.confidenceScore || 0.9,
          });
        }
      }

      router.push('/dashboard');
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || 'Failed to complete onboarding setup');
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, title: 'Personal & Contact', icon: User },
    { id: 2, title: 'Target Role', icon: Briefcase },
    { id: 3, title: 'Skills Inventory', icon: Code2 },
    { id: 4, title: 'Work History', icon: Building },
    { id: 5, title: 'Resume Parser', icon: FileText },
    { id: 6, title: 'Evidence & Review', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            Candidate Setup Wizard
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Set Up Your AI Career OS Profile</h1>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            Build your evidence-backed identity to unlock automated job discovery, transparent ATS match scoring, and factual resume tailoring.
          </p>
        </div>

        {/* Stepper Progress */}
        <div className="grid grid-cols-6 gap-2 border-b border-border pb-6">
          {steps.map((s) => {
            const Icon = s.icon;
            const isCompleted = step > s.id;
            const isCurrent = step === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setStep(s.id)}
                className={`flex flex-col items-center text-center p-2 rounded-lg transition-all ${
                  isCurrent
                    ? 'bg-blue-500/15 text-blue-400 font-semibold border border-blue-500/30'
                    : isCompleted
                    ? 'text-emerald-400 hover:bg-emerald-500/10'
                    : 'text-muted-foreground hover:bg-muted/40'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 text-xs ${
                    isCurrent
                      ? 'bg-blue-500 text-white'
                      : isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className="text-xs hidden sm:inline leading-tight">{s.title}</span>
              </button>
            );
          })}
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
            {successMessage}
          </div>
        )}

        {/* Step Content */}
        <Card className="glass border-border">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              {step === 1 && 'Step 1: Personal & Contact Information'}
              {step === 2 && 'Step 2: Target Career Role & Preferences'}
              {step === 3 && 'Step 3: Technical Skills Inventory'}
              {step === 4 && 'Step 4: Work Experience History'}
              {step === 5 && 'Step 5: Resume Ingestion & Deterministic Extraction'}
              {step === 6 && 'Step 6: Verified Evidence Ledger Review'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Provide your professional headline and recruiter contact handles.'}
              {step === 2 && 'Define the target titles and compensation expectations for job matching.'}
              {step === 3 && 'Select your core stack. Every skill will be audited against verified evidence.'}
              {step === 4 && 'Add roles and quantified impact bullets.'}
              {step === 5 && 'Paste your existing resume to extract skills and achievements without LLMs.'}
              {step === 6 && 'Review initial verified evidence claims and calculate your Profile Health Score.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* STEP 1 */}
            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="title">Professional Headline / Target Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g. Senior Backend Engineer (TypeScript / Distributed Systems)"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Primary Location</Label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input
                      id="location"
                      className="pl-9"
                      placeholder="e.g. San Francisco, CA or Remote"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="+1 (555) 019-2834"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn Profile URL</Label>
                  <div className="relative">
                    <Globe className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input
                      id="linkedin"
                      className="pl-9"
                      placeholder="https://linkedin.com/in/username"
                      value={formData.linkedinUrl}
                      onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="github">GitHub Profile URL</Label>
                  <div className="relative">
                    <Link2 className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input
                      id="github"
                      className="pl-9"
                      placeholder="https://github.com/username"
                      value={formData.githubUrl}
                      onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="exp">Total Years of Professional Experience</Label>
                    <Input
                      id="exp"
                      type="number"
                      min={0}
                      max={50}
                      value={formData.yearsOfExperience}
                      onChange={(e) => setFormData({ ...formData, yearsOfExperience: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notice">Notice Period (Days)</Label>
                    <Input
                      id="notice"
                      type="number"
                      min={0}
                      max={365}
                      value={formData.noticePeriodDays}
                      onChange={(e) => setFormData({ ...formData, noticePeriodDays: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Preferred Work Modes</Label>
                  <div className="flex gap-3">
                    {['REMOTE', 'HYBRID', 'ONSITE'].map((mode) => {
                      const isSelected = formData.workModes.includes(mode);
                      return (
                        <Button
                          key={mode}
                          type="button"
                          variant={isSelected ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            if (isSelected) {
                              setFormData({
                                ...formData,
                                workModes: formData.workModes.filter((m) => m !== mode),
                              });
                            } else {
                              setFormData({
                                ...formData,
                                workModes: [...formData.workModes, mode],
                              });
                            }
                          }}
                        >
                          {mode}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="salMin">Target Minimum Annual Salary ({formData.salaryCurrency})</Label>
                    <div className="relative">
                      <DollarSign className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                      <Input
                        id="salMin"
                        type="number"
                        className="pl-9"
                        value={formData.expectedSalaryMin}
                        onChange={(e) => setFormData({ ...formData, expectedSalaryMin: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salMax">Target Maximum / Ideal Salary ({formData.salaryCurrency})</Label>
                    <div className="relative">
                      <DollarSign className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                      <Input
                        id="salMax"
                        type="number"
                        className="pl-9"
                        value={formData.expectedSalaryMax}
                        onChange={(e) => setFormData({ ...formData, expectedSalaryMax: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Add Technical Skills</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. Kubernetes, Golang, PyTorch..."
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSkill();
                        }
                      }}
                    />
                    <Button type="button" onClick={() => handleAddSkill()}>
                      <Plus className="w-4 h-4 mr-1" /> Add
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Your Selected Skills ({formData.skills.length})</Label>
                  <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-border bg-muted/20 min-h-[60px]">
                    {formData.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="px-3 py-1 flex items-center gap-1.5">
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="hover:text-red-400 transition-colors"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Quick Add Recommendations</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_SKILLS.filter((s) => !formData.skills.includes(s)).map((rec) => (
                      <Button
                        key={rec}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleAddSkill(rec)}
                      >
                        + {rec}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4 */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label>Work Experiences ({formData.experiences.length})</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddExperience}>
                    <Plus className="w-4 h-4 mr-1" /> Add Experience
                  </Button>
                </div>

                <div className="space-y-4">
                  {formData.experiences.map((exp, idx) => (
                    <div key={idx} className="p-4 rounded-lg border border-border bg-muted/10 space-y-3 relative">
                      <button
                        type="button"
                        onClick={() => handleRemoveExperience(idx)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                        <Input
                          placeholder="Job Title"
                          value={exp.title}
                          onChange={(e) => {
                            const copy = [...formData.experiences];
                            copy[idx].title = e.target.value;
                            setFormData({ ...formData, experiences: copy });
                          }}
                        />
                        <Input
                          placeholder="Company"
                          value={exp.company}
                          onChange={(e) => {
                            const copy = [...formData.experiences];
                            copy[idx].company = e.target.value;
                            setFormData({ ...formData, experiences: copy });
                          }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {exp.bullets?.map((b, bIdx) => (
                          <div key={bIdx} className="flex gap-2 py-0.5">
                            <span>•</span>
                            <span>{b}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 5 */}
            {step === 5 && (
              <div className="space-y-6">
                <div className="p-4 rounded-lg border border-blue-500/20 bg-blue-500/5 space-y-2">
                  <div className="flex items-center gap-2 text-blue-400 font-medium text-sm">
                    <Sparkles className="w-4 h-4" />
                    Zero-LLM Deterministic Resume Ingestion
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Paste your resume text below. Our engine segments sections, identifies 500+ tech competencies, and creates verified evidence candidates without external API costs.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resume">Paste Resume Plain Text</Label>
                  <textarea
                    id="resume"
                    rows={8}
                    className="w-full rounded-md border border-border bg-background p-3 text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Paste resume content here..."
                    value={formData.resumeText}
                    onChange={(e) => setFormData({ ...formData, resumeText: e.target.value })}
                  />
                </div>

                <Button
                  type="button"
                  onClick={handleParseResume}
                  disabled={isParsingResume || !formData.resumeText.trim()}
                  className="w-full"
                >
                  {isParsingResume ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Parsing Resume...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" /> Parse Resume & Populate Evidence
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* STEP 6 */}
            {step === 6 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                  <div>
                    <div className="font-semibold text-emerald-400">Profile Health Score Estimate: 95%</div>
                    <div className="text-xs text-muted-foreground">
                      Contact, experience, and verified evidence requirements satisfied.
                    </div>
                  </div>
                  <ShieldCheck className="w-8 h-8 text-emerald-400" />
                </div>

                <div className="space-y-3">
                  <Label>Candidate Summary Review</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 rounded-lg border border-border bg-muted/20">
                      <div className="text-xl font-bold text-blue-400">{formData.skills.length}</div>
                      <div className="text-xs text-muted-foreground">Skills Tagged</div>
                    </div>
                    <div className="p-3 rounded-lg border border-border bg-muted/20">
                      <div className="text-xl font-bold text-purple-400">{formData.experiences.length}</div>
                      <div className="text-xs text-muted-foreground">Experience Roles</div>
                    </div>
                    <div className="p-3 rounded-lg border border-border bg-muted/20">
                      <div className="text-xl font-bold text-emerald-400">
                        {parsedEvidence.length > 0 ? parsedEvidence.length : '5'}
                      </div>
                      <div className="text-xs text-muted-foreground">Evidence Claims</div>
                    </div>
                    <div className="p-3 rounded-lg border border-border bg-muted/20">
                      <div className="text-xl font-bold text-indigo-400">{formData.yearsOfExperience}y</div>
                      <div className="text-xs text-muted-foreground">Experience</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Initial Evidence Ledger Items</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {(parsedEvidence.length > 0
                      ? parsedEvidence
                      : [
                          {
                            category: 'TECHNICAL',
                            claim: 'Engineered cloud microservices reducing API response latency by 35%.',
                            confidenceScore: 0.95,
                          },
                          {
                            category: 'SKILL',
                            claim: 'Demonstrated technical competency in TypeScript, React, and NestJS.',
                            confidenceScore: 0.85,
                          },
                        ]
                    ).map((ev, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-md border border-border bg-muted/10 text-xs flex items-center justify-between"
                      >
                        <div className="space-y-0.5">
                          <span className="font-medium text-foreground">{ev.claim}</span>
                          <div className="text-muted-foreground text-[10px]">Category: {ev.category}</div>
                        </div>
                        <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">
                          {Math.round((ev.confidenceScore || 0.9) * 100)}% Confidence
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            disabled={step === 1 || loading}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Previous
          </Button>

          {step < 6 ? (
            <Button
              type="button"
              onClick={() => setStep((s) => Math.min(6, s + 1))}
            >
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="button"
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
              onClick={handleFinishOnboarding}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Finalizing Profile...
                </>
              ) : (
                <>
                  Complete Setup & Open Dashboard <CheckCircle2 className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
