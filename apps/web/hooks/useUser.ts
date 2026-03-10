'use client';

/**
 * useUser — état d'authentification Supabase.
 *
 * Souscrit aux changements d'état d'auth en temps réel.
 * Expose le user courant et le statut premium (depuis la table user_premium).
 *
 * Client Component justifié : Supabase browser client, état réactif.
 * Spec : docs/ARCHITECTURE.md — Supabase uniquement pour premium
 */

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

interface UserState {
  user: User | null;
  isPremium: boolean;
  loading: boolean;
}

export function useUser(): UserState {
  const [user, setUser] = useState<User | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    // Charger l'utilisateur initial
    void supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u);
      if (u) void fetchPremiumStatus(u.id);
      else setLoading(false);
    });

    // Écouter les changements d'état
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) void fetchPremiumStatus(u.id);
      else {
        setIsPremium(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  async function fetchPremiumStatus(userId: string) {
    try {
      const { data } = await supabase
        .from('user_premium')
        .select('is_premium')
        .eq('user_id', userId)
        .single();
      setIsPremium(data?.is_premium === true);
    } catch {
      // Table inexistante ou erreur réseau → status gratuit par défaut
      setIsPremium(false);
    } finally {
      setLoading(false);
    }
  }

  return { user, isPremium, loading };
}
