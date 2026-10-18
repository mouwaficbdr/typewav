'use client';

import { useAudioEngine } from '@/hooks/useAudioEngine';
import { isNonDesktopDevice } from '@/lib/device';
import enMessages from '@/messages/en.json';
import frMessages from '@/messages/fr.json';
import { useAudioStore } from '@/stores/useAudioStore';
import { NextIntlClientProvider, useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { exitSettings, type IntroExit, type IntroLanguage } from './apply-exit';
import { FINAL_CHORD, SAMPLER_WAIT_MS, STAFF_PHRASE, playChord } from './intro-music';
import { DataScreen } from './screens/DataScreen';
import { FEATURE_KEYS, FeaturesScreen } from './screens/FeaturesScreen';
import { LanguageScreen } from './screens/LanguageScreen';
import { StartScreen } from './screens/StartScreen';
import { WhyScreen } from './screens/WhyScreen';
import { Staff } from './Staff';

const INTRO_MESSAGES: Record<IntroLanguage, { intro: typeof frMessages.intro }> = {
  fr: { intro: frMessages.intro },
  en: { intro: enMessages.intro },
};

const FEATURES_INTERVAL_MS = 2800;
const LETTER_CODE = /^Key[A-Z]$/;
const DIGIT_CODE = /^Digit([1-5])$/;

interface OuvertureProps {
  urlLocale: IntroLanguage;
  firstRun: boolean;
  onClose: (exit: IntroExit) => void;
}

/**
 * L'Ouverture : rideau plein écran monté par `HomeClient`, pas une route
 * (spec partie B, « Entrée, sortie, mémoire »). Gère l'état et la navigation ;
 * `OuvertureChrome` porte le rendu et les textes, sous son propre
 * `NextIntlClientProvider` (namespace `intro`, langue de l'Ouverture, pas
 * forcément celle de l'URL).
 */
export function Ouverture({ urlLocale, firstRun, onClose }: OuvertureProps) {
  const [language, setLanguage] = useState<IntroLanguage>(urlLocale);
  const [chosenLanguage, setChosenLanguage] = useState<IntroLanguage | null>(
    null,
  );
  const [screen, setScreen] = useState(1);
  const [touchMode, setTouchMode] = useState(() => isNonDesktopDevice());
  const [waitedPastTimeout, setWaitedPastTimeout] = useState(false);
  const [featuresIndex, setFeaturesIndex] = useState(0);
  const [featuresUserChosen, setFeaturesUserChosen] = useState(false);
  const [featuresRest, setFeaturesRest] = useState(false);
  const [dataExpanded, setDataExpanded] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const { initialize, playNoteName } = useAudioEngine();
  const isSamplerLoaded = useAudioStore((s) => s.isSamplerLoaded);

  const screenRef = useRef(screen);
  screenRef.current = screen;
  const waitedPastTimeoutRef = useRef(waitedPastTimeout);
  waitedPastTimeoutRef.current = waitedPastTimeout;

  const currentExit = useCallback(
    (): IntroExit => ({ chosenLanguage, introLanguage: language, firstRun }),
    [chosenLanguage, language, firstRun],
  );

  const chooseLanguage = useCallback(
    (lang: IntroLanguage) => {
      setLanguage(lang);
      setChosenLanguage(lang);
      void initialize();
    },
    [initialize],
  );

  /** Valide l'écran `current` (joue sa note), avance ou ferme depuis l'écran 6. */
  const advanceFrom = useCallback(
    (current: number) => {
      if (current >= 6) {
        onClose(currentExit());
        return;
      }
      void playChord(
        [STAFF_PHRASE[current - 1] ?? STAFF_PHRASE[0]!],
        playNoteName,
        () => isSamplerLoaded,
      );
      setScreen(current + 1);
    },
    [isSamplerLoaded, playNoteName, onClose, currentExit],
  );

  // Dès que le piano est prêt à l'écran 1, on avance automatiquement : pas
  // besoin d'un second geste après le choix de langue qui a démarré l'audio.
  useEffect(() => {
    if (screenRef.current === 1 && isSamplerLoaded) {
      advanceFrom(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSamplerLoaded]);

  // Au-delà de SAMPLER_WAIT_MS sans piano, on peut continuer sans son.
  useEffect(() => {
    if (screen !== 1 || isSamplerLoaded) return;
    const id = setTimeout(() => setWaitedPastTimeout(true), SAMPLER_WAIT_MS);
    return () => clearTimeout(id);
  }, [screen, isSamplerLoaded]);

  // Écran 4 : les envies défilent seules tant qu'aucun geste ne les a fixées.
  useEffect(() => {
    if (screen !== 4 || featuresUserChosen || featuresRest) return;
    const id = setInterval(() => {
      setFeaturesIndex((i) => {
        if (i >= FEATURE_KEYS.length - 1) {
          setFeaturesRest(true);
          return i;
        }
        return i + 1;
      });
    }, FEATURES_INTERVAL_MS);
    return () => clearInterval(id);
  }, [screen, featuresUserChosen, featuresRest]);

  // Écran 6 : la phrase se rejoue en entier et se conclut sur l'accord.
  useEffect(() => {
    if (screen !== 6) return;
    void playChord(FINAL_CHORD, playNoteName, () => isSamplerLoaded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  // Bascule en mode clavier dès la première frappe de lettre physique.
  useEffect(() => {
    const onAnyKey = (e: KeyboardEvent) => {
      if (LETTER_CODE.test(e.code)) setTouchMode(false);
    };
    window.addEventListener('keydown', onAnyKey);
    return () => window.removeEventListener('keydown', onAnyKey);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose(currentExit());
        return;
      }

      const current = screenRef.current;

      if (current === 1) {
        if (e.code === 'KeyF') {
          chooseLanguage('fr');
          return;
        }
        if (e.code === 'KeyE') {
          chooseLanguage('en');
          return;
        }
        if (
          waitedPastTimeoutRef.current &&
          (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight')
        ) {
          e.preventDefault();
          setScreen(2);
        }
        return;
      }

      if (current === 4) {
        const digit = DIGIT_CODE.exec(e.code);
        if (digit) {
          setFeaturesIndex(Number(digit[1]) - 1);
          setFeaturesUserChosen(true);
          setFeaturesRest(false);
          return;
        }
      }

      if (current === 5 && e.code === 'KeyI') {
        setDataExpanded(true);
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setScreen((s) => Math.max(1, s - 1));
        return;
      }

      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault();
        advanceFrom(current);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [advanceFrom, chooseLanguage, currentExit, onClose]);

  const handleShare = useCallback(() => {
    const url = window.location.origin;
    if (navigator.share) {
      navigator.share({ url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url).then(() => setShareCopied(true));
    }
  }, []);

  const handleTouchContinue = useCallback(() => {
    if (screenRef.current === 1) {
      chooseLanguage(language);
      return;
    }
    advanceFrom(screenRef.current);
  }, [advanceFrom, chooseLanguage, language]);

  return (
    <NextIntlClientProvider locale={language} messages={INTRO_MESSAGES[language]}>
      <OuvertureChrome
        screen={screen}
        touchMode={touchMode}
        language={language}
        languageStatus={
          waitedPastTimeout ? 'failed' : chosenLanguage ? 'tuning' : 'idle'
        }
        featuresIndex={featuresIndex}
        featuresRest={featuresRest}
        dataExpanded={dataExpanded}
        shareCopied={shareCopied}
        onChooseLanguage={chooseLanguage}
        onSelectFeature={(i) => {
          setFeaturesIndex(i);
          setFeaturesUserChosen(true);
          setFeaturesRest(false);
        }}
        onShare={handleShare}
        onExplore={() => onClose(currentExit())}
        onSkip={() => onClose(currentExit())}
        onTouchContinue={handleTouchContinue}
      />
    </NextIntlClientProvider>
  );
}

interface ChromeProps {
  screen: number;
  touchMode: boolean;
  language: IntroLanguage;
  languageStatus: 'idle' | 'tuning' | 'failed';
  featuresIndex: number;
  featuresRest: boolean;
  dataExpanded: boolean;
  shareCopied: boolean;
  onChooseLanguage: (lang: IntroLanguage) => void;
  onSelectFeature: (index: number) => void;
  onShare: () => void;
  onExplore: () => void;
  onSkip: () => void;
  onTouchContinue: () => void;
}

function screenTitle(
  screen: number,
  t: ReturnType<typeof useTranslations>,
  featuresIndex: number,
  featuresRest: boolean,
): string {
  switch (screen) {
    case 1:
      return t('language.prompt');
    case 2:
      return t('play.instruction');
    case 3:
      return t('why.title');
    case 4:
      return featuresRest
        ? t('features.rest')
        : t(`features.${FEATURE_KEYS[featuresIndex] ?? FEATURE_KEYS[0]}.title`);
    case 5:
      return t('data.title');
    default:
      return t('start.title');
  }
}

function OuvertureChrome({
  screen,
  touchMode,
  language,
  languageStatus,
  featuresIndex,
  featuresRest,
  dataExpanded,
  shareCopied,
  onChooseLanguage,
  onSelectFeature,
  onShare,
  onExplore,
  onSkip,
  onTouchContinue,
}: ChromeProps) {
  const t = useTranslations('intro');
  const title = screenTitle(screen, t, featuresIndex, featuresRest);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'var(--color-bg)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 'clamp(24px, 5vw, 64px)',
      }}
    >
      {touchMode ? (
        <button
          type="button"
          data-testid="intro-continue-touch"
          onClick={onTouchContinue}
          aria-label={t('continueTouch')}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'transparent',
            border: 'none',
          }}
        />
      ) : null}

      <div aria-live="polite" className="sr-only">
        {t('announce', { n: screen, title })}
      </div>

      <div
        role="region"
        aria-label="Ouverture"
        data-intro-screen={screen}
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '40px',
        }}
      >
        <div style={{ maxWidth: '58%' }}>
          {screen === 1 && (
            <LanguageScreen
              language={language}
              status={languageStatus}
              onChoose={onChooseLanguage}
            />
          )}
          {screen === 2 && <div data-part="play-screen-placeholder" />}
          {screen === 3 && <WhyScreen />}
          {screen === 4 && (
            <FeaturesScreen
              activeIndex={featuresIndex}
              showRest={featuresRest}
              onSelect={onSelectFeature}
            />
          )}
          {screen === 5 && <DataScreen expanded={dataExpanded} />}
          {screen === 6 && (
            <StartScreen
              touchMode={touchMode}
              onShare={onShare}
              onExplore={onExplore}
              copied={shareCopied}
            />
          )}
        </div>

        <Staff step={screen} heads={[]} />
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 'clamp(16px, 3vw, 32px)',
          left: 'clamp(16px, 3vw, 32px)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.78rem',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--color-text-muted)',
        }}
      >
        {touchMode ? t('continueTouch') : t('continue')}
      </div>

      {touchMode ? (
        <button
          type="button"
          onClick={onSkip}
          style={{
            position: 'absolute',
            top: 'clamp(16px, 3vw, 32px)',
            right: 'clamp(16px, 3vw, 32px)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.78rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--color-text-muted)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {t('skipTouch')}
        </button>
      ) : (
        <div
          style={{
            position: 'absolute',
            top: 'clamp(16px, 3vw, 32px)',
            right: 'clamp(16px, 3vw, 32px)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.78rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--color-text-muted)',
          }}
        >
          {t('skip')}
        </div>
      )}
    </div>
  );
}
