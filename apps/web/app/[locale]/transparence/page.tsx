import type { Metadata } from 'next';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Transparence — TypeWav',
  description:
    "Revenus, coûts d'infrastructure et modèle économique de TypeWav.",
};

/**
 * Page de transparence financière — Server Component (statique).
 * Spec : docs/specs/00-project-overview.md — Principe directeur
 */
export default function TransparencePage() {
  const currentMonth = new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <main
      className="flex min-h-dvh flex-col items-center gap-12 p-8 pt-16"
      style={{
        backgroundColor: 'var(--color-bg)',
        maxWidth: '720px',
        margin: '0 auto',
      }}
    >
      <header className="text-center">
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2.5rem',
            fontWeight: '300',
            color: 'var(--color-text-primary)',
            letterSpacing: '0.05em',
          }}
        >
          Transparence
        </h1>
        <p
          style={{
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.875rem',
            marginTop: '8px',
          }}
        >
          Mise à jour : {currentMonth}
        </p>
      </header>

      {/* Principe */}
      <section className="w-full">
        <h2
          style={{
            color: 'var(--color-accent)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.75rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginBottom: '16px',
          }}
        >
          Notre principe
        </h2>
        <p
          style={{
            color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.9375rem',
            lineHeight: '1.7',
          }}
        >
          TypeWav est open source et gratuit à 100 % en fonctionnalités core. La
          version Premium débloque des packs sonores cinématiques et la sync
          cloud, mais{' '}
          <strong>aucune fonctionnalité de typing n&apos;est paywallée</strong>.
          Tous les revenus couvrent l&apos;infrastructure et financent le
          développement futur.
        </p>
      </section>

      {/* Revenus vs Coûts */}
      <section className="w-full">
        <h2
          style={{
            color: 'var(--color-accent)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.75rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginBottom: '16px',
          }}
        >
          Modèle économique
        </h2>
        <div className="flex flex-col gap-4">
          {[
            {
              label: 'Hébergement Vercel (Hobby)',
              cost: '0 €/mois',
              note: 'Gratuit pour projets personnels',
            },
            {
              label: 'Supabase (Free tier)',
              cost: '0 €/mois',
              note: '500 MB DB, 50 000 MAU — suffisant Phase 4',
            },
            {
              label: 'Stripe (frais transaction)',
              cost: '1,4 % + 0,25 €',
              note: 'Par transaction EU',
            },
            {
              label: 'Domaine typewav.app',
              cost: '~15 €/an',
              note: 'Renouvellement annuel',
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-start justify-between gap-4 rounded-md p-4"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div>
                <p
                  style={{
                    color: 'var(--color-text-primary)',
                    fontFamily: 'var(--font-ui)',
                    fontSize: '0.875rem',
                  }}
                >
                  {item.label}
                </p>
                <p
                  style={{
                    color: 'var(--color-text-muted)',
                    fontFamily: 'var(--font-ui)',
                    fontSize: '0.75rem',
                    marginTop: '2px',
                  }}
                >
                  {item.note}
                </p>
              </div>
              <span
                style={{
                  color: 'var(--color-accent)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.875rem',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.cost}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Stack open source */}
      <section className="w-full">
        <h2
          style={{
            color: 'var(--color-accent)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.75rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginBottom: '16px',
          }}
        >
          Construit sur l&apos;open source
        </h2>
        <p
          style={{
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.875rem',
            lineHeight: '1.7',
          }}
        >
          Next.js, Tone.js, Tailwind CSS, Supabase, Vitest, idb, Zustand,
          Motion, Recharts — des centaines de contributeurs rendent TypeWav
          possible. Le code source de TypeWav est lui-même disponible sur
          GitHub.
        </p>
      </section>

      {/* Soutenir le projet */}
      <section className="w-full">
        <h2
          style={{
            color: 'var(--color-accent)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.75rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginBottom: '16px',
          }}
        >
          Soutenir le projet
        </h2>
        <p
          style={{
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.875rem',
            lineHeight: '1.7',
            marginBottom: '20px',
          }}
        >
          TypeWav est développé bénévolement. Si l&apos;outil vous est utile, un
          soutien ponctuel ou récurrent aide à financer le temps de
          développement, les packs sonores, et les collections de contenu.
        </p>
        <div className="flex flex-wrap gap-4">
          <a
            href="https://ko-fi.com/typewav"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-accent)',
              borderRadius: '6px',
              color: 'var(--color-accent)',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.875rem',
              textDecoration: 'none',
              transition: 'opacity 0.15s',
            }}
            className="hover:opacity-80"
          >
            ☕ Ko-fi — Soutien ponctuel
          </a>
          <a
            href="https://github.com/sponsors/mouwaficbdr"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.875rem',
              textDecoration: 'none',
              transition: 'opacity 0.15s',
            }}
            className="hover:opacity-80"
          >
            ♥ GitHub Sponsors — Soutien mensuel
          </a>
        </div>
      </section>

      <Link
        href="/"
        style={{
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.8125rem',
          textDecoration: 'none',
        }}
        className="hover:underline"
      >
        ← Retour au typing
      </Link>
    </main>
  );
}
