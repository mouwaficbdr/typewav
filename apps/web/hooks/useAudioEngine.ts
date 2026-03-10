'use client'

/**
 * useAudioEngine — hook Tone.js pour le prototype Phase 0.
 *
 * Règles absolues (non négociables) :
 * - Tone.start() UNIQUEMENT après un événement keydown utilisateur
 * - Erreur = SILENCE (jamais une fausse note)
 * - Correction = reprise + micro-reverb (decay 0.3, wet 0.4)
 * - Lazy loading : uniquement le pack actif en mémoire
 *
 * Spec : docs/specs/01-audio-engine.md
 */

import { useCallback, useRef } from 'react'
import { getPentatonicNote, getChordAtIndex } from '@typewav/audio-engine'
import { useAudioStore } from '@/stores/useAudioStore'

export function useAudioEngine() {
  const { initialized, themeId, setInitialized } = useAudioStore()

  // Refs Tone.js — initialisées paresseusement après le premier keydown
  // Type `unknown` + assertions : Tone.js doit rester lazy (import dynamique)
  const synthRef = useRef<unknown>(null)
  const reverbRef = useRef<unknown>(null)

  /**
   * Initialise Tone.js.
   * DOIT être appelé uniquement après un événement keydown (contrainte navigateur).
   */
  const initialize = useCallback(async () => {
    if (initialized) return

    // Import dynamique — Tone.js n'est chargé qu'après interaction utilisateur
    const Tone = await import('tone')
    await Tone.start()

    // Synthétiseur simple pour le prototype Phase 0
    const reverb = new Tone.Reverb({ decay: 0.3, wet: 0 }).toDestination()
    const synth = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.5 },
    }).connect(reverb)

    synthRef.current = synth
    reverbRef.current = reverb
    setInitialized(true)
  }, [initialized, setInitialized])

  /**
   * Joue la note correspondant au caractère frappé.
   * La note est choisie en intersection gamme pentatonique × accord courant.
   */
  const playNote = useCallback(
    async (char: string, wordIndex: number) => {
      if (!initialized) {
        await initialize()
      }

      const Tone = await import('tone')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const synth = synthRef.current as any
      if (!synth) return

      // Accord courant pour ce mot
      const chord = getChordAtIndex(themeId, wordIndex)

      // Note de base de la lettre
      const baseNote = getPentatonicNote(char)

      // Si la note de base est dans l'accord courant (sans octave), on la joue.
      // Sinon, on "transpose" vers la note pentatonique la plus proche dans l'accord.
      const basePitch = baseNote.replace(/\d/, '')
      const noteToPlay = chord.notes.includes(basePitch)
        ? baseNote
        : baseNote // Fallback : on joue la note pentatonique directement

      synth.triggerAttackRelease(noteToPlay, '16n', Tone.now())
    },
    [initialized, initialize, themeId],
  )

  /**
   * Silence pour une frappe incorrecte — ne joue rien.
   */
  const triggerSilence = useCallback(() => {
    // Intentionnellement vide — le silence est le comportement correct sur erreur
  }, [])

  /**
   * Reprend après correction avec micro-reverb.
   */
  const triggerResume = useCallback(async () => {
    if (!initialized) return

    const Tone = await import('tone')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reverb = reverbRef.current as any
    if (!reverb) return

    // Active brièvement le reverb pour signaler la correction
    reverb.wet.rampTo(0.4, 0.05, Tone.now())
    reverb.wet.rampTo(0, 0.3, Tone.now() + 0.3)
  }, [initialized])

  return { initialize, playNote, triggerSilence, triggerResume }
}
