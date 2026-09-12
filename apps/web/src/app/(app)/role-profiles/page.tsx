'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { roleProfilesApi } from '@/lib/api';
import {
  Briefcase,
  Sliders,
  Plus,
  Trash2,
  MapPin,
  DollarSign,
  Star,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function RoleProfilesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [newProfile, setNewProfile] = useState({
    name: '',
    targetTitle: '',
    seniority: 'MID',
    requiredSkillsText: 'TypeScript, PostgreSQL, NestJS',
    preferredSkillsText: 'Docker, Redis, AWS',
    salaryMin: 100000,
    salaryMax: 140000,
    salaryCurrency: 'USD',
    workModes: ['REMOTE', 'HYBRID'],
    locationsText: 'Remote, San Francisco, CA',
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const res = await roleProfilesApi.getRoleProfiles();
      if (res?.data) {
        setProfiles(res.data);
      }
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || 'Failed to load role profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadProfiles();
    }
  }, [isAuthenticated]);

  const handleSetDefault = async (id: string) => {
    try {
      await roleProfilesApi.setDefault(id);
      await loadProfiles();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || 'Failed to update default profile');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await roleProfilesApi.deleteRoleProfile(id);
      await loadProfiles();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || 'Failed to delete role profile');
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfile.targetTitle.trim()) return;

    try {
      await roleProfilesApi.createRoleProfile({
        name: newProfile.name || newProfile.targetTitle,
        targetTitle: newProfile.targetTitle,
        seniority: newProfile.seniority,
        requiredSkills: newProfile.requiredSkillsText.split(',').map((s) => s.trim()).filter(Boolean),
        preferredSkills: newProfile.preferredSkillsText.split(',').map((s) => s.trim()).filter(Boolean),
        workModes: newProfile.workModes,
        employmentTypes: ['FULL_TIME'],
        locations: newProfile.locationsText.split(',').map((s) => s.trim()).filter(Boolean),
        salaryMin: Number(newProfile.salaryMin),
        salaryMax: Number(newProfile.salaryMax),
        salaryCurrency: newProfile.salaryCurrency,
      });

      setShowAddModal(false);
      await loadProfiles();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || 'Failed to create role profile');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
              <ChevronRight className="w-3 h-3" />
              <Link href="/profile" className="hover:text-foreground">Profile</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-foreground">Target Role Profiles</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Sliders className="w-6 h-6 text-blue-400" />
              Target Role Profiles
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Configure different target job roles (e.g. Backend vs. DevOps) with custom salary floors, required skills, and work modes.
            </p>
          </div>

          <Button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-500">
            <Plus className="w-4 h-4 mr-1.5" />
            Add Target Role
          </Button>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {errorMessage}
          </div>
        )}

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="max-w-lg w-full glass border-border shadow-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Create Target Role Profile</CardTitle>
                <CardDescription>Customize target criteria for automated job matching.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateProfile} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="rp-title">Target Job Title</Label>
                    <Input
                      id="rp-title"
                      placeholder="e.g. Senior Backend Engineer"
                      value={newProfile.targetTitle}
                      onChange={(e) => setNewProfile({ ...newProfile, targetTitle: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="rp-seniority">Seniority Level</Label>
                      <select
                        id="rp-seniority"
                        className="w-full rounded-md border border-border bg-background p-2 text-sm"
                        value={newProfile.seniority}
                        onChange={(e) => setNewProfile({ ...newProfile, seniority: e.target.value })}
                      >
                        <option value="ENTRY">ENTRY</option>
                        <option value="JUNIOR">JUNIOR</option>
                        <option value="MID">MID</option>
                        <option value="SENIOR">SENIOR</option>
                        <option value="LEAD">LEAD</option>
                        <option value="PRINCIPAL">PRINCIPAL</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="rp-sal">Min Salary ({newProfile.salaryCurrency})</Label>
                      <Input
                        id="rp-sal"
                        type="number"
                        value={newProfile.salaryMin}
                        onChange={(e) => setNewProfile({ ...newProfile, salaryMin: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="rp-req-skills">Required Skills (Comma separated)</Label>
                    <Input
                      id="rp-req-skills"
                      placeholder="TypeScript, PostgreSQL, NestJS, Docker"
                      value={newProfile.requiredSkillsText}
                      onChange={(e) => setNewProfile({ ...newProfile, requiredSkillsText: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="rp-pref-skills">Preferred Skills (Comma separated)</Label>
                    <Input
                      id="rp-pref-skills"
                      placeholder="Kubernetes, Redis, GraphQL, AWS"
                      value={newProfile.preferredSkillsText}
                      onChange={(e) => setNewProfile({ ...newProfile, preferredSkillsText: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="rp-locations">Target Locations (Comma separated)</Label>
                    <Input
                      id="rp-locations"
                      placeholder="Remote, San Francisco, New York"
                      value={newProfile.locationsText}
                      onChange={(e) => setNewProfile({ ...newProfile, locationsText: e.target.value })}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-3">
                    <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-500">
                      Save Role Profile
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Role Profiles Grid */}
        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        ) : profiles.length === 0 ? (
          <Card className="glass border-border py-12 text-center">
            <CardContent className="space-y-3">
              <Briefcase className="w-10 h-10 text-muted-foreground mx-auto" />
              <h3 className="font-semibold text-lg">No Target Roles Configured</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Set up target roles with your preferred skills and compensation criteria to begin automated matching.
              </p>
              <Button onClick={() => setShowAddModal(true)} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1.5" /> Create First Role Profile
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profiles.map((p) => (
              <Card key={p.id} className="glass border-border hover:border-border/80 transition-all relative">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg text-foreground">{p.targetTitle}</h3>
                        {p.isDefault && (
                          <Badge variant="outline" className="text-blue-400 border-blue-500/30 bg-blue-500/10 text-[10px]">
                            Primary Target
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                        <span>Seniority: {p.seniority || 'Mid/Senior'}</span>
                        <span>•</span>
                        <span>{(p.workModes || []).join(', ')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!p.isDefault && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs text-blue-400 hover:text-blue-300 border-blue-500/30"
                          onClick={() => handleSetDefault(p.id)}
                        >
                          <Star className="w-3.5 h-3.5 mr-1" /> Set Primary
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400"
                        onClick={() => handleDelete(p.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">Required Skills:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {(p.requiredSkills || []).map((s: string) => (
                        <Badge key={s} variant="secondary" className="text-xs">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {p.preferredSkills?.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-xs font-medium text-muted-foreground">Preferred Skills:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {(p.preferredSkills || []).map((s: string) => (
                          <Badge key={s} variant="outline" className="text-[11px] text-muted-foreground">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-foreground/70" />
                      <span>
                        {p.salaryMin ? `${p.salaryMin.toLocaleString()}` : '—'} – {p.salaryMax ? `${p.salaryMax.toLocaleString()}` : '—'} {p.salaryCurrency || 'USD'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-foreground/70" />
                      <span>{(p.locations || ['Remote']).join(', ')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
