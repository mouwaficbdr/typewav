/**
 * Icons — système d'icônes SVG inline TypeWav.
 *
 * Toutes inline React, currentColor, 16×16 par défaut.
 * Zéro dépendance externe.
 */

type IconProps = { size?: number; className?: string };

// ═══ NAVIGATION ════════════════════════════════════════════════════════════════

export const KeyboardIcon = ({ size = 16, className }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect x="1" y="3.5" width="14" height="9" rx="1" />
    <rect
      x="3"
      y="5.5"
      width="2"
      height="1.8"
      rx=".3"
      fill="currentColor"
      stroke="none"
    />
    <rect
      x="6.5"
      y="5.5"
      width="2"
      height="1.8"
      rx=".3"
      fill="currentColor"
      stroke="none"
    />
    <rect
      x="10"
      y="5.5"
      width="2"
      height="1.8"
      rx=".3"
      fill="currentColor"
      stroke="none"
    />
    <rect
      x="4.5"
      y="9"
      width="7"
      height="1.5"
      rx=".3"
      fill="currentColor"
      stroke="none"
    />
  </svg>
);

export const TrophyIcon = ({ size = 16, className }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M4 2h8v5a4 4 0 0 1-8 0V2z" />
    <path d="M2 4.5h2M12 4.5h2" />
    <path d="M8 7v3.5" />
    <path d="M5.5 12h5" />
    <path d="M4.5 14h7" />
  </svg>
);

export const StarIcon = ({ size = 16, className }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <polygon points="8,1 9.8,5.6 14.7,5.8 10.9,8.9 12.1,13.7 8,11 3.9,13.7 5.1,8.9 1.3,5.8 6.2,5.6" />
  </svg>
);

export const UserIcon = ({ size = 16, className }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx="8" cy="5.5" r="2.5" />
    <path d="M2.5 14c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5" />
  </svg>
);

// ═══ CONFIG BAR — MODES ════════════════════════════════════════════════════════

export const ClockIcon = ({ size = 16, className }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx="8" cy="8" r="6" />
    <path d="M8 4.5v4l2.5 1.5" />
  </svg>
);

export const AlignLeftIcon = ({ size = 16, className }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.2"
    strokeLinecap="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M2 4h12M2 7h8M2 10h10M2 13h7" />
  </svg>
);

export const QuoteIcon = ({ size = 16, className }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M3 3.5c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v1a2.5 2.5 0 0 1-2.5 2.5V14c1.9 0 3.5-1.6 3.5-3.5V5.5c0-1.1-.9-2-2-2zM10 3.5c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v1A2.5 2.5 0 0 1 8.5 13V14c1.9 0 3.5-1.6 3.5-3.5V5.5c0-1.1-.9-2-2-2z" />
  </svg>
);

export const ZenIcon = ({ size = 16, className }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.2"
    strokeLinecap="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M1 10c1.5-3 3-3 4.5 0S9 13 10.5 10 13 7 14.5 10" />
    <circle cx="8" cy="5" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

export const CodeIcon = ({ size = 16, className }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M5 4L1 8l4 4M11 4l4 4-4 4M9.5 2.5l-3 11" />
  </svg>
);

export const GraduationIcon = ({ size = 16, className }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M1.5 6.5l6.5-3 6.5 3-6.5 3z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1"
    />
    <path d="M4.5 8.5v3.5a3.5 3.5 0 0 0 7 0V8.5" />
    <path d="M14.5 6.5v3.5" />
  </svg>
);

export const GhostIcon = ({ size = 16, className }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M8 1a5 5 0 0 0-5 5v7l1.5-1.5L6 13l1.5-1.5L9 13l1.5-1.5L12 13V6a5 5 0 0 0-4-4.9A5 5 0 0 0 8 1z" />
    <circle cx="6.3" cy="6.5" r="0.9" fill="white" />
    <circle cx="9.7" cy="6.5" r="0.9" fill="white" />
  </svg>
);

export const MusicBarsIcon = ({ size = 16, className }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.2"
    strokeLinecap="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M1.5 7h13M1.5 9.5h13M1.5 12h13" />
    <circle cx="4.5" cy="7" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="10.5" cy="9.5" r="1.5" fill="currentColor" stroke="none" />
    <path d="M4.5 7V3.5M4.5 3.5l5-1.3v5.3" strokeWidth="1" />
  </svg>
);

export const PenIcon = ({ size = 16, className }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M11.5 2l2.5 2.5-8 8H3.5v-2.5z" />
    <path d="M9.5 4l2.5 2.5" />
  </svg>
);

export const FlagIcon = ({ size = 16, className }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M3 2v12" />
    <path d="M3 2l10 3-10 3" />
  </svg>
);

// ═══ ACTIONS (Results / Zone 5) ════════════════════════════════════════════════

export const ArrowRightIcon = ({ size = 16, className }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M3 8h10M9 4l4 4-4 4" />
  </svg>
);

export const RefreshIcon = ({ size = 16, className }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M13.5 8A5.5 5.5 0 1 1 8 2.5c1.8 0 3.4.9 4.4 2.2" />
    <path d="M13.5 2.5v3h-3" />
  </svg>
);

export const PlayIcon = ({ size = 16, className }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M4 2.5v11l9-5.5z" />
  </svg>
);

export const ReplayIcon = ({ size = 16, className }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M11.5 3v10L5 8z" />
    <rect x="3" y="3" width="1.5" height="10" rx=".4" />
  </svg>
);

export const MusicNoteIcon = ({ size = 16, className }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M13 2v7.27a2.2 2.2 0 1 1-1.5-2.08V4.1L7 5.37v6.36a2.2 2.2 0 1 1-1.5-2.08V4z" />
  </svg>
);

export const ArrowLeftIcon = ({ size = 16, className }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M13 8H3M7 4l-4 4 4 4" />
  </svg>
);

export const AtIcon = ({ size = 16, className }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx="8" cy="8" r="2.5" />
    <path d="M10.5 8A2.5 2.5 0 0 0 8 5.5c-3 0-4.5 2-4.5 2.5S5 13 8 13c1.5 0 2.5-.5 3-1" />
  </svg>
);

export const HashIcon = ({ size = 16, className }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.2"
    strokeLinecap="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M5 2l-1.5 12M12 2l-1.5 12M2.5 6h11M2 10h11" />
  </svg>
);

export const GlobeIcon = ({ size = 16, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    <path d="M2 12h20"/>
  </svg>
);

export const ZapIcon = ({ size = 16, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

export const WavesIcon = ({ size = 16, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
    <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
    <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
  </svg>
);

export const VenetianMaskIcon = ({ size = 16, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M2 12a5 5 0 0 0 5 5 8 8 0 0 1 5 2 8 8 0 0 1 5-2 5 5 0 0 0 5-5V7h-5a8 8 0 0 0-8 3 8 8 0 0 0-8-3H2z"/><path d="M6 11c1.5 0 3-.5 3-2-2 0-3 0-3 2Z"/><path d="M18 11c-1.5 0-3-.5-3-2 2 0 3 0 3 2Z"/>
  </svg>
);

export const FlowerIcon = ({ size = 16, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M12 7.5a4.5 4.5 0 1 1 4.5 4.5M12 7.5A4.5 4.5 0 1 0 7.5 12M12 7.5V12m0 0a4.5 4.5 0 1 0 4.5 4.5M12 12a4.5 4.5 0 1 1-4.5 4.5M12 12v9"/>
  </svg>
);

export const RepeatIcon = ({ size = 16, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="m17 2 4 4-4 4"/>
    <path d="M3 11v-1a4 4 0 0 1 4-4h14"/>
    <path d="m7 22-4-4 4-4"/>
    <path d="M21 13v1a4 4 0 0 1-4 4H3"/>
  </svg>
);

export const LanguagesIcon = ({ size = 16, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="m5 8 6 6" />
    <path d="m4 14 6-6 2-3" />
    <path d="M2 5h12" />
    <path d="M7 2h1" />
    <path d="m22 22-5-10-5 10" />
    <path d="M14 18h6" />
  </svg>
);



export const RotateCwIcon = ({ size = 16, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>
  </svg>
);
