'use client';

/**
 * usePseudo : pseudo local de l'utilisateur.
 *
 * La v1 n'a pas de comptes. Le pseudo est saisi dans /parametres et vit dans
 * `UserProfile.pseudo` (IndexedDB). Sert au « c'est toi » du classement local
 * et à personnaliser /profil.
 */

import { getUserProfile } from '@/lib/db';
import { useEffect, useState } from 'react';

export function usePseudo(): string {
  const [pseudo, setPseudo] = useState('');

  useEffect(() => {
    getUserProfile()
      .then((profile) => setPseudo(profile.pseudo))
      .catch(() => {
        // IndexedDB indisponible : pseudo vide, sans erreur visible.
      });
  }, []);

  return pseudo;
}
