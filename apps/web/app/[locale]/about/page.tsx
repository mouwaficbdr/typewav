import { AboutSection } from '@/components/about/AboutSection';
import {
  DefinitionList,
  type DefinitionItem,
} from '@/components/about/DefinitionList';
import { ShortcutRow } from '@/components/about/ShortcutRow';
import { Keycap } from '@/components/ui/Keycap';
import { routing } from '@/i18n/routing';
import { buildMetadata } from '@/lib/seo';
import { BookText, CircleUserRound, Github, Scale } from 'lucide-react';
import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

const LINK_STYLE = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.85rem',
  color: 'var(--color-text-muted)',
  textDecoration: 'none',
} as const;

type Props = {
  params: Promise<{ locale: string }>;
};

function resolveLocale(raw: string): (typeof routing.locales)[number] {
  return hasLocale(routing.locales, raw) ? raw : routing.defaultLocale;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: 'about' });
  return buildMetadata({
    locale,
    title: t('metaTitle'),
    description: t('metaDescription'),
  });
}

const MODE_KEYS = [
  'classic',
  'sprint',
  'quote',
  'zen',
  'code',
  'learning',
  'ghost',
  'custom',
] as const;

const GLOSSARY_KEYS = ['wpm', 'wpmNet', 'accuracy', 'consistency'] as const;

/**
 * Page À propos : Server Component, contenu statique traduit.
 *
 * Traitement éditorial (front-matter de magazine) : masthead `--font-display`,
 * rubriques numérotées, tout en tokens de thème pour suivre la refonte visuelle
 * en cours. Voir aussi `Keycap` (section raccourcis, réutilisable ailleurs).
 */
export default async function AboutPage({ params }: Props) {
  const locale = resolveLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: 'about' });

  const manifestoRules: DefinitionItem[] = [
    { term: t('manifesto.correctTerm'), description: t('manifesto.correctDesc') },
    { term: t('manifesto.wrongTerm'), description: t('manifesto.wrongDesc') },
    {
      term: t('manifesto.backspaceTerm'),
      description: t('manifesto.backspaceDesc'),
    },
    { term: t('manifesto.tempoTerm'), description: t('manifesto.tempoDesc') },
  ];

  const modes: DefinitionItem[] = MODE_KEYS.map((key) => ({
    term: t(`modes.${key}Name`),
    description: t(`modes.${key}Desc`),
  }));

  const glossary: DefinitionItem[] = GLOSSARY_KEYS.map((key) => ({
    term: t(`glossary.${key}Term`),
    description: t(`glossary.${key}Desc`),
  }));

  return (
    <main
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: 'clamp(24px, 5vw, 48px) clamp(20px, 6vw, 56px) 96px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '44px',
      }}
    >
      {/* Masthead : le titre de rubrique en mono, la thèse en display, la
          formulation plate juste en dessous pour que l'aha tienne en 3 s. */}
      <header style={{ width: '100%' }}>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
          }}
        >
          {t('kicker')}
        </p>
        <h1
          style={{
            margin: '14px 0 0',
            fontFamily: 'var(--font-display)',
            fontWeight: 300,
            fontSize: 'clamp(2.4rem, 7vw, 3.6rem)',
            lineHeight: 1.08,
            letterSpacing: '0.01em',
            color: 'var(--color-text-primary)',
          }}
        >
          {t('masthead')}
        </h1>
        <p
          style={{
            margin: '20px 0 0',
            maxWidth: '72ch',
            fontFamily: 'var(--font-ui)',
            fontSize: '1.02rem',
            lineHeight: 1.7,
            color: 'var(--color-text-muted)',
          }}
        >
          {t('lead')}
        </p>
      </header>

      <AboutSection index="01" label={t('manifesto.heading')}>
        <p
          style={{
            margin: '0 0 20px',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.98rem',
            lineHeight: 1.75,
            color: 'var(--color-text-primary)',
          }}
        >
          {t('manifesto.body')}
        </p>
        <DefinitionList items={manifestoRules} variant="inline" />
      </AboutSection>

      <AboutSection index="02" label={t('music.heading')}>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-ui)',
            fontSize: '0.95rem',
            lineHeight: 1.75,
            color: 'var(--color-text-muted)',
          }}
        >
          {t('music.body')}
        </p>
      </AboutSection>

      <AboutSection index="03" label={t('modes.heading')}>
        <DefinitionList items={modes} variant="inline" />
      </AboutSection>

      <AboutSection index="04" label={t('corpus.heading')}>
        <p
          style={{
            margin: '0 0 16px',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.95rem',
            lineHeight: 1.75,
            color: 'var(--color-text-muted)',
          }}
        >
          {t('corpus.body')}
        </p>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            letterSpacing: '0.04em',
            color: 'var(--color-accent)',
          }}
        >
          {t('corpus.collections')}
        </p>
      </AboutSection>

      <AboutSection index="05" label={t('local.heading')}>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-ui)',
            fontSize: '0.95rem',
            lineHeight: 1.75,
            color: 'var(--color-text-muted)',
          }}
        >
          {t.rich('local.body', {
            settings: (chunks) => (
              <Link
                href={`/${locale}/parametres`}
                style={{
                  color: 'var(--color-text-primary)',
                  textDecoration: 'underline',
                  textUnderlineOffset: '3px',
                }}
                className="hover:text-[var(--color-accent)] transition-colors"
              >
                {chunks}
              </Link>
            ),
          })}
        </p>
      </AboutSection>

      <AboutSection index="06" label={t('shortcuts.heading')}>
        <div style={{ width: '100%' }}>
          <ShortcutRow
            keys={
              <>
                <Keycap>Tab</Keycap>
                <Keycap>↵</Keycap>
              </>
            }
            description={t('shortcuts.restart')}
          />
          <ShortcutRow
            keys={<Keycap>↵</Keycap>}
            description={t('shortcuts.encore')}
          />
          <ShortcutRow
            keys={<Keycap>⌫</Keycap>}
            description={t('shortcuts.backspace')}
          />
          <ShortcutRow
            keys={<Keycap>{t('shortcuts.escKey')}</Keycap>}
            description={t('shortcuts.escape')}
          />
        </div>
      </AboutSection>

      <AboutSection index="07" label={t('glossary.heading')}>
        <DefinitionList items={glossary} variant="stack" />
      </AboutSection>

      <AboutSection index="08" label={t('links.heading')}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '18px 34px' }}>
          <a
            href="https://github.com/mouwaficbdr/typewav"
            target="_blank"
            rel="noopener noreferrer"
            style={LINK_STYLE}
            className="hover:text-[var(--color-text-primary)] transition-colors"
          >
            <Github size={16} aria-hidden="true" />
            {t('links.github')}
          </a>
          <a
            href="https://github.com/mouwaficbdr/typewav#readme"
            target="_blank"
            rel="noopener noreferrer"
            style={LINK_STYLE}
            className="hover:text-[var(--color-text-primary)] transition-colors"
          >
            <BookText size={16} aria-hidden="true" />
            {t('links.readme')}
          </a>
          <a
            href="https://github.com/mouwaficbdr"
            target="_blank"
            rel="noopener noreferrer"
            style={LINK_STYLE}
            className="hover:text-[var(--color-text-primary)] transition-colors"
          >
            <CircleUserRound size={16} aria-hidden="true" />
            {t('links.profile')}
          </a>
          <Link
            href={`/${locale}/transparence`}
            style={LINK_STYLE}
            className="hover:text-[var(--color-text-primary)] transition-colors"
          >
            <Scale size={16} aria-hidden="true" />
            {t('links.terms')}
          </Link>
        </div>
      </AboutSection>

      <div
        style={{
          width: '100%',
          borderTop:
            '1px solid color-mix(in srgb, var(--color-border) 55%, transparent)',
          paddingTop: '30px',
        }}
      >
        <Link
          href={`/${locale}`}
          style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: '1.5rem',
            fontWeight: 400,
            color: 'var(--color-text-primary)',
            textDecoration: 'none',
          }}
          className="hover:text-[var(--color-accent)] transition-colors"
        >
          {t('closing')} <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    </main>
  );
}
