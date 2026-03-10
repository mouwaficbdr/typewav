export type CollectionLanguage = 'fr' | 'en' | 'multi';

export type TextDifficulty = 'easy' | 'medium' | 'hard';

/** Langage de programmation d'un snippet — utilisé pour le Mode Code */
export type CodeLanguage =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'rust'
  | 'go'
  | 'sql';

export interface TextEntry {
  id: string;
  content: string;
  /** Auteur / œuvre source */
  source?: string;
  difficulty: TextDifficulty;
  language: 'fr' | 'en';
  tags: string[];
  /** Langage de programmation — renseigné uniquement pour la collection code */
  codeLanguage?: CodeLanguage;
}

export interface CollectionConfig {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  language: CollectionLanguage;
  /** Thème AudioEngine recommandé pour cette collection */
  recommendedTheme?: string;
  /** Pack sonore recommandé pour cette collection */
  recommendedSoundPack?: string;
  isPremium: boolean;
  texts: TextEntry[];
}
