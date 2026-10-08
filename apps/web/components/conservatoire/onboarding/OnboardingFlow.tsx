'use client';

/**
 * L'onboarding de TypeWav, dans le Conservatoire (spec partie 2, « Les
 * écrans ») : onze écrans d'une seule chose chacun.
 *
 * Exception documentée à la règle de capture : ces écrans visent des touches
 * physiques sans composer de texte, donc une seule écoute `keydown` sur
 * `window` lit `KeyboardEvent.code`. Le test de placement, lui, passe par
 * `TypingArea` et sa capture cachée.
 */

import { FINGER_COLORS } from '@/components/modes/finger-colors';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { useKeyboardLayoutPreference } from '@/hooks/useKeyboardLayoutPreference';
import { CADENCE, CHOICE_NOTE, pitchForCode } from '@/lib/conservatoire/instrument';
import { detectLayoutFromKey, detectLayoutFromNavigator } from '@/lib/conservatoire/layout-detection';
import { HOME_SCALE, keyByCode } from '@/lib/conservatoire/physical-keys';
import { placementOutcome, saveProfile } from '@/lib/conservatoire/profile';
import type { KeyboardLayout } from '@/lib/keyboardLayouts';
import { markOnboardingComplete } from '@/lib/onboarding';
import type { DailyMinutes, ExperienceLevel, PlacementResult } from '@typewav/types';
import { useTranslations } from 'next-intl';
import { useEffect, useEffectEvent, useRef, useState, type ReactNode } from 'react';
import { LivingKeyboard, type LivingKeyboardHandle } from '../LivingKeyboard';
import { Stage } from '../Stage';
import { PlacementTest } from './PlacementTest';

type Step =
  | 'intro' | 'f' | 'j' | 'scale' | 'blind' | 'silence'
  | 'data' | 'experience' | 'minutes' | 'placement' | 'ready';

const SKIPPABLE: readonly Step[] = [
  'intro', 'f', 'j', 'scale', 'blind', 'silence', 'data', 'experience', 'minutes',
];
const ADVANCE_MS = 650;
const CHOICE_MS = 400;
const HINT_MS = 1600;
/** La cadence attend que la dernière note de la gamme ait sonné. */
const CADENCE_DELAY_MS = 300;
const EXPERIENCES: readonly ExperienceLevel[] = ['beginner', 'some-fingers', 'touch-typist'];
const EXPERIENCE_LABEL: Record<ExperienceLevel, string> = {
  beginner: 'beginner',
  'some-fingers': 'someFingers',
  'touch-typist': 'touchTypist',
};
const MINUTES: readonly DailyMinutes[] = [5, 10, 15];

/** 1, 2, 3 par position physique : sur AZERTY, la touche « 1 » produit « & ». */
function choiceIndex(code: string): number | null {
  const match = /^(?:Digit|Numpad)([123])$/.exec(code);
  return match ? Number(match[1]) - 1 : null;
}

function isContinue(code: string): boolean {
  return code === 'Space' || code === 'Enter' || code === 'NumpadEnter';
}

export interface OnboardingFlowProps {
  /** Fin de l'écran 10 : la première leçon commence. */
  onComplete: () => void;
  /** « Passer » confirmé : retour à l'accueil de TypeWav. */
  onSkip: () => void;
}

export function OnboardingFlow({ onComplete, onSkip }: OnboardingFlowProps) {
  const t = useTranslations('conservatoire.onboarding');
  const tc = useTranslations('conservatoire');
  const tTyping = useTranslations('typing');
  const { initialize, playNoteName } = useAudioEngine();
  const { layout, setLayout } = useKeyboardLayoutPreference();
  const keyboardRef = useRef<LivingKeyboardHandle>(null);
  const lockedRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [step, setStep] = useState<Step>('intro');
  const [scaleIndex, setScaleIndex] = useState(0);
  const [silencePhase, setSilencePhase] = useState<'title' | 'other' | 'done'>('title');
  const [detailOpen, setDetailOpen] = useState(false);
  const [dataSeen, setDataSeen] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [experience, setExperience] = useState<ExperienceLevel | null>(null);
  const [minutes, setMinutes] = useState<DailyMinutes | null>(null);
  const [placement, setPlacement] = useState<PlacementResult | null>(null);

  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  function later(ms: number, fn: () => void) {
    timersRef.current.push(setTimeout(fn, ms));
  }

  function go(next: Step) {
    setStep(next);
    setScaleIndex(0);
    setDetailOpen(false);
    if (next === 'data') setDataSeen(true);
  }

  function goAfter(ms: number, next: Step) {
    lockedRef.current = true;
    later(ms, () => {
      lockedRef.current = false;
      go(next);
    });
  }

  function play(code: string) {
    const note = pitchForCode(code);
    if (note) void playNoteName(note);
    keyboardRef.current?.ripple(code);
  }

  function celebrate() {
    for (const [note, delay, duration] of CADENCE) {
      later(CADENCE_DELAY_MS + delay, () => void playNoteName(note, duration));
    }
    HOME_SCALE.forEach((code, i) =>
      later(CADENCE_DELAY_MS + i * 60, () => keyboardRef.current?.ripple(code)),
    );
  }

  async function finish(skipped: boolean) {
    lockedRef.current = true;
    await Promise.all([
      markOnboardingComplete().catch(() => undefined),
      saveProfile({
        version: 1,
        startedAt: Date.now(),
        experience,
        dailyMinutes: minutes,
        placement,
        outcome: !skipped && experience ? placementOutcome(experience, placement) : null,
        skipped,
      }),
    ]);
    if (skipped) onSkip();
    else onComplete();
  }

  function skip() {
    if (dataSeen) {
      void finish(true);
      return;
    }
    setSkipping(true);
    go('data');
  }

  function choose(index: number) {
    void playNoteName(CHOICE_NOTE, 0.3);
    if (step === 'experience') {
      setExperience(EXPERIENCES[index]!);
      goAfter(CHOICE_MS, 'minutes');
    } else {
      setMinutes(MINUTES[index]!);
      goAfter(CHOICE_MS, experience === 'beginner' ? 'ready' : 'placement');
    }
  }

  const applyLayout = useEffectEvent((detected: KeyboardLayout | null) => {
    if (detected && detected !== layout) setLayout(detected);
  });

  useEffect(() => {
    let cancelled = false;
    void detectLayoutFromNavigator(navigator).then((detected) => {
      if (!cancelled) applyLayout(detected);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    applyLayout(detectLayoutFromKey(e.code, e.key));
    if (e.target instanceof Element && e.target.closest('button')) return;
    if (lockedRef.current) return;
    const scaleDone = scaleIndex >= HOME_SCALE.length;

    switch (step) {
      case 'intro':
        if (!isContinue(e.code)) return;
        e.preventDefault();
        void initialize();
        go('f');
        return;
      case 'f':
      case 'j': {
        const want = step === 'f' ? 'KeyF' : 'KeyJ';
        if (e.code !== want) return;
        e.preventDefault();
        play(want);
        goAfter(ADVANCE_MS, step === 'f' ? 'j' : 'scale');
        return;
      }
      case 'scale':
      case 'blind':
        if (scaleDone) {
          if (!isContinue(e.code)) return;
          e.preventDefault();
          go(step === 'scale' ? 'blind' : 'silence');
          return;
        }
        if (e.code !== HOME_SCALE[scaleIndex]) return;
        e.preventDefault();
        play(e.code);
        if (scaleIndex + 1 === HOME_SCALE.length) celebrate();
        setScaleIndex(scaleIndex + 1);
        return;
      case 'silence':
        if (silencePhase === 'done') {
          if (!isContinue(e.code)) return;
          e.preventDefault();
          setSilencePhase('title');
          go('data');
          return;
        }
        if (e.code === 'KeyK') {
          e.preventDefault();
          play('KeyK');
          setSilencePhase('other');
          return;
        }
        if (silencePhase === 'other') {
          e.preventDefault();
          setSilencePhase('done');
        }
        return;
      case 'data':
        if (e.code === 'KeyI') {
          e.preventDefault();
          setDetailOpen((open) => !open);
          return;
        }
        if (!isContinue(e.code)) return;
        e.preventDefault();
        if (skipping) void finish(true);
        else go('experience');
        return;
      case 'experience':
      case 'minutes': {
        const index = choiceIndex(e.code);
        if (index === null) return;
        e.preventDefault();
        choose(index);
        return;
      }
      case 'placement':
        if (!placement || !isContinue(e.code)) return;
        e.preventDefault();
        go('ready');
        return;
      case 'ready':
        if (!isContinue(e.code)) return;
        e.preventDefault();
        void finish(false);
        return;
    }
  });

  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Rendu

  const scaleDone = scaleIndex >= HOME_SCALE.length;
  let target: string | undefined;
  if (step === 'f') target = 'KeyF';
  else if (step === 'j') target = 'KeyJ';
  else if ((step === 'scale' || step === 'blind') && !scaleDone) target = HOME_SCALE[scaleIndex];
  else if (step === 'silence' && silencePhase === 'title') target = 'KeyK';

  const continueHint = tc('continue');
  let title: string;
  let support: string | undefined;
  let footer: string | undefined;
  let slot: ReactNode;

  // Même position dans l'arbre d'un écran à l'autre : le clavier (et ses ondes
  // en cours) survit aux transitions de F à la fin du silence.
  const keyboard = (
    <>
      {(step === 'scale' || step === 'blind') && (
        <div aria-hidden="true" style={{ display: 'flex', gap: 6 }}>
          {HOME_SCALE.map((code, i) => (
            <span
              key={code}
              style={{
                width: 28,
                height: 4,
                borderRadius: 2,
                background: i < scaleIndex ? FINGER_COLORS[keyByCode(code)!.finger] : 'var(--color-border)',
                transition: 'background 240ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              }}
            />
          ))}
        </div>
      )}
      <LivingKeyboard
        ref={keyboardRef}
        layout={layout}
        {...(target !== undefined ? { target } : {})}
        {...(step === 'blind' ? { targetStyle: 'faint' as const, hintAfterMs: HINT_MS } : {})}
      />
    </>
  );

  const choices = (options: string[], chosen: number) => (
    <div role="group" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
      {options.map((label, i) => (
        <button
          key={label}
          type="button"
          aria-pressed={chosen === i}
          onClick={() => {
            if (!lockedRef.current) choose(i);
          }}
          style={{
            padding: '12px 20px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            background: chosen === i ? 'var(--color-accent)' : 'transparent',
            color: chosen === i ? 'var(--color-bg)' : 'inherit',
            fontFamily: 'var(--font-ui)',
            fontSize: 15,
            cursor: 'pointer',
            transition: 'background 240ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        >
          <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.6, marginRight: 8 }}>{i + 1}</span>
          {label}
        </button>
      ))}
    </div>
  );

  switch (step) {
    case 'intro':
      title = t('intro.title');
      support = t('intro.support');
      footer = t('intro.start');
      break;
    case 'f':
    case 'j':
      title = t(`${step}.title`);
      support = t(`${step}.support`);
      slot = keyboard;
      break;
    case 'scale':
      title = scaleDone ? t('scale.done') : t('scale.title');
      if (scaleDone) footer = continueHint;
      slot = keyboard;
      break;
    case 'blind':
      title = scaleDone ? t('blind.done') : t('blind.title');
      if (scaleDone) footer = continueHint;
      else support = t('blind.support');
      slot = keyboard;
      break;
    case 'silence':
      title = t(`silence.${silencePhase}`);
      if (silencePhase === 'done') footer = continueHint;
      slot = keyboard;
      break;
    case 'data':
      title = t('data.title');
      support = t('data.support');
      footer = continueHint;
      if (detailOpen) {
        slot = (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'center' }}>
            {(['detail1', 'detail2', 'detail3'] as const).map((k) => (
              <p key={k} style={{ margin: 0, fontFamily: 'var(--font-ui)' }}>
                {t(`data.${k}`)}
              </p>
            ))}
          </div>
        );
      }
      break;
    case 'experience':
      title = t('experience.title');
      footer = t('choiceHint');
      slot = choices(
        EXPERIENCES.map((e) => t(`experience.${EXPERIENCE_LABEL[e]}`)),
        experience ? EXPERIENCES.indexOf(experience) : -1,
      );
      break;
    case 'minutes':
      title = t('minutes.title');
      footer = t('choiceHint');
      slot = choices(
        MINUTES.map((m) => t('minutes.option', { minutes: m })),
        minutes ? MINUTES.indexOf(minutes) : -1,
      );
      break;
    case 'placement':
      if (placement) {
        title = t('placement.result', { wpm: placement.wpm, accuracy: placement.accuracy });
        footer = continueHint;
      } else {
        title = t('placement.title');
        support = t('placement.support');
        slot = <PlacementTest onDone={setPlacement} />;
      }
      break;
    case 'ready':
      title = t('ready.title');
      footer = continueHint;
      break;
  }

  // Sans regarder, l'annonce ne trahit pas la touche attendue.
  const targetKey = target !== undefined && step !== 'blind' ? keyByCode(target) : undefined;
  const announce = targetKey
    ? `${title} ${tc('announceTarget', {
        key: targetKey.labels[layout].toUpperCase(),
        finger: tTyping(`finger.${targetKey.finger}`),
      })}`
    : title;
  const canSkip = SKIPPABLE.includes(step) && !(step === 'data' && skipping);

  return (
    <Stage
      title={title}
      announce={announce}
      {...(support !== undefined ? { support } : {})}
      {...(footer !== undefined ? { footer } : {})}
      {...(canSkip ? { onSkip: skip } : {})}
    >
      {slot}
    </Stage>
  );
}
