export { pianoPack } from './piano/soundpack.config';

// Décision produit définitive (Phase 4) : piano est l'unique sound pack, plus
// rien à débloquer ou à vendre. Ce package (comme @typewav/themes) n'est de
// toute façon jamais importé par apps/web aujourd'hui, la vraie source de
// vérité côté moteur audio est PACK_CONFIGS dans
// apps/web/hooks/useAudioEngine.ts.
export const ALL_SOUND_PACKS = ['piano'] as const;
export type SoundPackId = (typeof ALL_SOUND_PACKS)[number];
