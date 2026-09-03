import { routing } from '@/i18n/routing';
import { buildMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ locale: string }>;
};

function resolveLocale(raw: string): (typeof routing.locales)[number] {
  return hasLocale(routing.locales, raw) ? raw : routing.defaultLocale;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: 'transparence' });
  return buildMetadata({
    locale,
    title: t('metaTitle'),
    description: t('metaDescription'),
  });
}

/**
 * Page de transparence financière : Server Component.
 * Spec : docs/specs/00-project-overview.md, principe directeur.
 */
export default async function TransparencePage({ params }: Props) {
  const locale = resolveLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: 'transparence' });

  const currentMonth = new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const costRows = [
    {
      label: t('hostingLabel'),
      cost: t('hostingCost'),
      note: t('hostingNote'),
    },
    { label: t('dbLabel'), cost: t('dbCost'), note: t('dbNote') },
    {
      label: t('stripeLabel'),
      cost: t('stripeCost'),
      note: t('stripeNote'),
    },
    {
      label: t('domainLabel'),
      cost: t('domainCost'),
      note: t('domainNote'),
    },
  ];

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
          {t('title')}
        </h1>
        <p
          style={{
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.875rem',
            marginTop: '8px',
          }}
        >
          {t('lastUpdated', { month: currentMonth })}
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
          {t('principleHeading')}
        </h2>
        <p
          style={{
            color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.9375rem',
            lineHeight: '1.7',
          }}
        >
          {t.rich('principleBody', {
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
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
          {t('economicsHeading')}
        </h2>
        <div className="flex flex-col gap-4">
          {costRows.map((item) => (
            <div
              key={item.label}
              className="flex items-start justify-between gap-4"
              style={{
                padding: '12px 0',
                borderBottom:
                  '1px solid color-mix(in srgb, var(--color-border) 40%, transparent)',
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
          {t('opensourceHeading')}
        </h2>
        <p
          style={{
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.875rem',
            lineHeight: '1.7',
          }}
        >
          {t('opensourceBody')}
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
          {t('supportHeading')}
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
          {t('supportBody')}
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
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-accent)',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.875rem',
              textDecoration: 'none',
              transition: 'opacity 0.15s',
            }}
            className="hover:opacity-80"
          >
            ☕ {t('koFiLabel')}
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
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.875rem',
              textDecoration: 'none',
              transition: 'opacity 0.15s',
            }}
            className="hover:opacity-80"
          >
            ♥ {t('sponsorsLabel')}
          </a>
        </div>
      </section>

      <Link
        href={`/${locale}`}
        style={{
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.8125rem',
          textDecoration: 'none',
        }}
        className="hover:underline"
      >
        ← {t('backToTyping')}
      </Link>
    </main>
  );
}
