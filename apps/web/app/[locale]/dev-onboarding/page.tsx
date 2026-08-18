import { IS_DEV_MODE } from '@/lib/featureFlags';
import { notFound } from 'next/navigation';
import { DevOnboardingClient } from './DevOnboardingClient';

/**
 * Route de dev UNIQUEMENT : isole le tutoriel d'onboarding pour l'itérer
 * sans devoir traverser le flux complet de l'app à chaque rechargement.
 * 404 en dehors de `next dev` (IS_DEV_MODE est figé à false hors dev).
 *
 * Contrepartie : le déclenchement automatique de l'onboarding à la première
 * visite est désactivé en dev dans HomeClient.tsx (voir le commentaire à
 * côté du guard IS_DEV_MODE, juste avant l'effet hasCompletedOnboarding).
 *
 * TODO(avant prod) : une fois l'onboarding validé et prêt à revalider en
 * conditions réelles, retirer ce guard dans HomeClient.tsx ET supprimer ce
 * dossier dev-onboarding en entier, cette route n'a plus de raison d'être.
 */
export default function DevOnboardingPage() {
  if (!IS_DEV_MODE) {
    notFound();
  }

  return <DevOnboardingClient />;
}
