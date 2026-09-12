'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { evidenceApi } from '@/lib/api';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Trash2,
  Search,
  Filter,
  Loader2,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function EvidenceLedgerPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({ PENDING: 0, VERIFIED: 0, REJECTED: 0 });
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New Evidence Modal/Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClaim, setNewClaim] = useState({
    category: 'TECHNICAL',
    claim: '',
    context: '',
    source: 'MANUAL',
    sourceDetail: '',
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const loadEvidence = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (activeFilter !== 'ALL') {
        params.status = activeFilter;
      }
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      const res = await evidenceApi.getEvidence(params);
      if (res?.data) {
        setItems(res.data.items);
        setCounts(res.data.counts || { PENDING: 0, VERIFIED: 0, REJECTED: 0 });
      }
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || 'Failed to load evidence records');
    } finally {
      setLoading(false);
    }
  }, [activeFilter, searchTerm]);

  useEffect(() => {
    if (isAuthenticated) {
      loadEvidence();
    }
  }, [isAuthenticated, loadEvidence]);

  const handleVerify = async (id: string, status: 'VERIFIED' | 'REJECTED') => {
    try {
      await evidenceApi.verifyEvidence(id, { status });
      await loadEvidence();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await evidenceApi.deleteEvidence(id);
      await loadEvidence();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || 'Failed to delete record');
    }
  };

  const handleCreateEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClaim.claim.trim()) return;
    try {
      await evidenceApi.createEvidence({
        ...newClaim,
        confidenceScore: 1.0,
      });
      setShowAddModal(false);
      setNewClaim({ category: 'TECHNICAL', claim: '', context: '', source: 'MANUAL', sourceDetail: '' });
      await loadEvidence();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || 'Failed to create evidence claim');
    }
  };

  const total = (counts.VERIFIED || 0) + (counts.PENDING || 0) + (counts.REJECTED || 0);

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
              <span className="text-foreground">Evidence Ledger</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              Candidate Evidence Ledger
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              The core differentiator: every resume bullet point and claim must map to verified evidence records.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={() => setShowAddModal(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white">
              <Plus className="w-4 h-4 mr-1.5" />
              Add Evidence Claim
            </Button>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-between text-xs text-red-400">
            <span className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              {errorMessage}
            </span>
            <button onClick={() => setErrorMessage(null)} className="underline hover:text-red-300">
              Dismiss
            </button>
          </div>
        )}

        {/* Counter cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`p-4 rounded-xl border text-left transition-all ${
              activeFilter === 'ALL'
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-border bg-card/40 hover:bg-card/70'
            }`}
          >
            <div className="text-2xl font-bold">{total}</div>
            <div className="text-xs text-muted-foreground">Total Claims</div>
          </button>

          <button
            onClick={() => setActiveFilter('VERIFIED')}
            className={`p-4 rounded-xl border text-left transition-all ${
              activeFilter === 'VERIFIED'
                ? 'border-emerald-500 bg-emerald-500/10'
                : 'border-border bg-card/40 hover:bg-card/70'
            }`}
          >
            <div className="text-2xl font-bold text-emerald-400">{counts.VERIFIED || 0}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Verified Claims
            </div>
          </button>

          <button
            onClick={() => setActiveFilter('PENDING')}
            className={`p-4 rounded-xl border text-left transition-all ${
              activeFilter === 'PENDING'
                ? 'border-amber-500 bg-amber-500/10'
                : 'border-border bg-card/40 hover:bg-card/70'
            }`}
          >
            <div className="text-2xl font-bold text-amber-400">{counts.PENDING || 0}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" /> Pending Verification
            </div>
          </button>

          <button
            onClick={() => setActiveFilter('REJECTED')}
            className={`p-4 rounded-xl border text-left transition-all ${
              activeFilter === 'REJECTED'
                ? 'border-red-500 bg-red-500/10'
                : 'border-border bg-card/40 hover:bg-card/70'
            }`}
          >
            <div className="text-2xl font-bold text-red-400">{counts.REJECTED || 0}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <XCircle className="w-3 h-3 text-red-400" /> Rejected / Unverified
            </div>
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search evidence claims, skills, or projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') loadEvidence();
              }}
            />
          </div>
          <Button variant="outline" onClick={loadEvidence}>
            <Filter className="w-4 h-4 mr-1.5" /> Filter
          </Button>
        </div>

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="max-w-lg w-full glass border-border shadow-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Create Evidence Claim</CardTitle>
                <CardDescription>Record verifiable proof of skill or project achievement.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateEvidence} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="ev-claim">Evidence Claim / Metric</Label>
                    <textarea
                      id="ev-claim"
                      rows={3}
                      className="w-full rounded-md border border-border bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="e.g. Architected microservice handling 10k req/sec with NestJS and Redis"
                      value={newClaim.claim}
                      onChange={(e) => setNewClaim({ ...newClaim, claim: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="ev-cat">Category</Label>
                      <select
                        id="ev-cat"
                        className="w-full rounded-md border border-border bg-background p-2 text-sm"
                        value={newClaim.category}
                        onChange={(e) => setNewClaim({ ...newClaim, category: e.target.value })}
                      >
                        <option value="TECHNICAL">TECHNICAL</option>
                        <option value="PROJECT">PROJECT</option>
                        <option value="LEADERSHIP">LEADERSHIP</option>
                        <option value="SKILL">SKILL</option>
                        <option value="CERTIFICATION">CERTIFICATION</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ev-source">Source Type</Label>
                      <select
                        id="ev-source"
                        className="w-full rounded-md border border-border bg-background p-2 text-sm"
                        value={newClaim.source}
                        onChange={(e) => setNewClaim({ ...newClaim, source: e.target.value })}
                      >
                        <option value="MANUAL">MANUAL</option>
                        <option value="RESUME">RESUME</option>
                        <option value="CERTIFICATION">CERTIFICATION</option>
                        <option value="PROJECT">PROJECT</option>
                        <option value="WORK_HISTORY">WORK_HISTORY</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="ev-context">Context / Project Name</Label>
                    <Input
                      id="ev-context"
                      placeholder="e.g. Production Telemetry Gateway"
                      value={newClaim.context}
                      onChange={(e) => setNewClaim({ ...newClaim, context: e.target.value })}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-3">
                    <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                      Save Claim
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Evidence List */}
        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        ) : items.length === 0 ? (
          <Card className="glass border-border py-12 text-center">
            <CardContent className="space-y-3">
              <ShieldCheck className="w-10 h-10 text-muted-foreground mx-auto" />
              <h3 className="font-semibold text-lg">No Evidence Records Found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No claims match your current filter. Import your resume or add manual claims to build your ledger.
              </p>
              <Button onClick={() => setShowAddModal(true)} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1.5" /> Add First Claim
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <Card key={item.id} className="glass border-border hover:border-border/80 transition-all">
                <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={
                          item.status === 'VERIFIED'
                            ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                            : item.status === 'REJECTED'
                            ? 'text-red-400 border-red-500/30 bg-red-500/10'
                            : 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                        }
                      >
                        {item.status}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {item.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        Source: {item.source} {item.sourceDetail ? `(${item.sourceDetail})` : ''}
                      </span>
                    </div>

                    <p className="text-sm font-medium text-foreground">{item.claim}</p>

                    {item.context && (
                      <p className="text-xs text-muted-foreground">
                        Context: <span className="text-foreground/80">{item.context}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {item.status !== 'VERIFIED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border-emerald-500/30"
                        onClick={() => handleVerify(item.id, 'VERIFIED')}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Verify
                      </Button>
                    )}
                    {item.status !== 'REJECTED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/30"
                        onClick={() => handleVerify(item.id, 'REJECTED')}
                      >
                        <XCircle className="w-4 h-4 mr-1" /> Reject
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-red-400"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
