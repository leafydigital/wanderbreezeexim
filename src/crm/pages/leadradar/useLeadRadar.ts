import { useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { runSearch } from './searchService';
import type { Lead, LeadStage, SearchParams, SearchMode } from './types';

// ── Search ────────────────────────────────────────────────────
export function useSearch() {
  const { user }                              = useAuth();
  const [results, setResults]                = useState<Lead[]>([]);
  const [loading, setLoading]                = useState(false);
  const [progress, setProgress]              = useState<Record<string, 'idle' | 'loading' | 'done'>>({});
  const [currentMode, setCurrentMode]        = useState<SearchMode>('leads');

  const search = useCallback(async (params: SearchParams) => {
    setLoading(true);
    setResults([]);
    setProgress({});
    setCurrentMode(params.mode);

    const leads = await runSearch({
      query:    params.query,
      location: params.location,
      limit:    params.limit,
      mode:     params.mode,
      onProgress: (src, done) =>
        setProgress(p => ({ ...p, [src]: done ? 'done' : 'loading' })),
    });

    setResults(leads);
    setLoading(false);

    // Log search to Supabase
    if (user?.id) {
      await supabase.from('sc_searches').insert({
        user_id:      user.id,
        query:        params.query,
        location:     params.location,
        result_count: leads.length,
        mode:         params.mode,
        sources: {
          osm:    params.mode === 'leads',  // OSM only for leads mode
          google: true,
          claude: true,
        },
      });
    }

    return leads;
  }, [user]);

  return { results, loading, progress, currentMode, search, setResults };
}

// ── Saved Leads ───────────────────────────────────────────────
export function useLeads() {
  const { user }              = useAuth();
  const [leads, setLeads]     = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLeads = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from('sc_leads')
      .select('*, sc_users!sc_leads_user_id_fkey(name)')
      .order('created_at', { ascending: false });

    const mapped = (data || []).map((r: any) => ({
      ...r,
      saved_by: r.sc_users?.name || null,
    }));
    setLeads(mapped as Lead[]);
    setLoading(false);
  }, [user]);

  const saveLead = useCallback(async (lead: Lead): Promise<string | null> => {
    if (!user?.id) return 'Not logged in';
    const { error } = await supabase.from('sc_leads').insert({
      user_id:        user.id,
      name:           lead.name,
      email:          lead.email,
      phone:          lead.phone,
      website:        lead.website,
      address:        lead.address,
      country:        lead.country,
      category:       lead.category,
      rating:         lead.rating,
      source:         lead.source,
      stage:          'new',
      linkedin:       lead.linkedin   || null,
      facebook:       lead.facebook   || null,
      instagram:      lead.instagram  || null,
      twitter:        lead.twitter    || null,
      products:       lead.products   || null,
      min_order:      lead.min_order  || null,
      certifications: lead.certifications || null,
    });
    return error?.message || null;
  }, [user]);

  const saveMany = useCallback(async (leads: Lead[]): Promise<number> => {
    if (!user?.id) return 0;
    const rows = leads.map(l => ({
      user_id:        user.id,
      name:           l.name,
      email:          l.email,
      phone:          l.phone,
      website:        l.website,
      address:        l.address,
      country:        l.country,
      category:       l.category,
      rating:         l.rating,
      source:         l.source,
      stage:          'new',
      linkedin:       l.linkedin   || null,
      facebook:       l.facebook   || null,
      instagram:      l.instagram  || null,
      twitter:        l.twitter    || null,
      products:       l.products   || null,
      min_order:      l.min_order  || null,
      certifications: l.certifications || null,
    }));
    const { data, error } = await supabase.from('sc_leads').insert(rows).select('id');
    if (error) return 0;
    return data?.length || 0;
  }, [user]);

  const updateStage = useCallback(async (id: string, stage: LeadStage) => {
    await supabase.from('sc_leads').update({ stage }).eq('id', id).eq('user_id', user!.id);
    setLeads(prev => prev.map(l => l.id === id ? { ...l, stage } : l));
  }, [user]);

  const deleteLead = useCallback(async (id: string) => {
    await supabase.from('sc_leads').delete().eq('id', id).eq('user_id', user!.id);
    setLeads(prev => prev.filter(l => l.id !== id));
  }, [user]);

  return { leads, loading, fetchLeads, saveLead, saveMany, updateStage, deleteLead };
}

// ── Analytics ─────────────────────────────────────────────────
export function useAnalytics() {
  const { user }            = useAuth();
  const [data, setData]     = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    const [leadsRes, searchesRes, stageRes] = await Promise.all([
      supabase.from('sc_leads').select('id', { count: 'exact', head: true }),
      supabase.from('sc_searches').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('sc_leads').select('stage').eq('user_id', user.id),
    ]);

    const byStage: Record<string, number> = {};
    (stageRes.data || []).forEach((r: any) => {
      byStage[r.stage] = (byStage[r.stage] || 0) + 1;
    });

    const recentSearches = await supabase
      .from('sc_searches')
      .select('query, location, result_count, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(8);

    setData({
      totalLeads:     leadsRes.count     || 0,
      totalSearches:  searchesRes.count  || 0,
      byStage,
      recentSearches: recentSearches.data || [],
    });
    setLoading(false);
  }, [user]);

  return { data, loading, fetchAnalytics };
}
