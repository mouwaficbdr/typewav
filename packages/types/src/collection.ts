export type CollectionLanguage = 'fr' | 'en' | 'multi';

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
  /** Contenu textuel brut à taper */
  content: string;
  /** Attribution : "Auteur — Œuvre (Année)" — optionnel pour code/gaming */
  source?: string;
  /** Langue du contenu (indépendant de la langue de l'interface) */
  language: 'fr' | 'en';
  /**
   * Niveau de difficulté numérique.
   * 1 = très facile, 2 = facile, 3 = moyen, 4 = difficile, 5 = très difficile
   */
  difficulty: 1 | 2 | 3 | 4 | 5;
  /** Nombre de mots (calculé à l'ingestion, pas à la volée) */
  wordCount: number;
  /** Nombre de caractères (contenu brut, espaces inclus) */
  charCount: number;
  /** Tags libres pour filtrage futur */
  tags?: string[];
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
