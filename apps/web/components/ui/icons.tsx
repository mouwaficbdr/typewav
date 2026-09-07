/**
 * Icons : système d'icônes TypeWav redigirées vers lucide-react.
 */

import {
  Keyboard,
  Trophy,
  Star,
  User,
  Clock,
  AlignLeft,
  Quote,
  Mountain, // Zen
  Code,
  GraduationCap,
  Ghost,
  AudioLines, // Music bars
  Pen,
  Flag,
  ArrowRight,
  RefreshCw,
  Play,
  RotateCcw, // Replay
  Music,
  ArrowLeft,
  AtSign,
  Hash,
  Globe,
  Zap,
  Waves,
  VenetianMask,
  Flower2,
  Repeat,
  Languages,
  RotateCw,
  BookOpen,
  Trash2,
  X,
  Plus,
  Palette,
  Search,
  Check,
  MousePointer2,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

type IconProps = {
  size?: number;
  className?: string;
  'data-testid'?: string;
};

// Wrapper helper to maintain the same props interface
const withProps = (IconComponent: any) => {
  return function IconWrapper({
    size = 16,
    className,
    'data-testid': dataTestId,
  }: IconProps) {
    return (
      <IconComponent size={size} className={className} data-testid={dataTestId} />
    );
  };
};

export const KeyboardIcon = withProps(Keyboard);
export const TrophyIcon = withProps(Trophy);
export const StarIcon = withProps(Star);
export const UserIcon = withProps(User);
export const ClockIcon = withProps(Clock);
export const AlignLeftIcon = withProps(AlignLeft);
export const QuoteIcon = withProps(Quote);
export const ZenIcon = withProps(Mountain);
export const CodeIcon = withProps(Code);
export const GraduationIcon = withProps(GraduationCap);
export const GhostIcon = withProps(Ghost);
export const MusicBarsIcon = withProps(AudioLines);
export const PenIcon = withProps(Pen);
export const FlagIcon = withProps(Flag);
export const ArrowRightIcon = withProps(ArrowRight);
export const RefreshIcon = withProps(RefreshCw);
export const PlayIcon = withProps(Play);
export const ReplayIcon = withProps(RotateCcw);
export const MusicNoteIcon = withProps(Music);
export const ArrowLeftIcon = withProps(ArrowLeft);
export const AtIcon = withProps(AtSign);
export const HashIcon = withProps(Hash);
export const GlobeIcon = withProps(Globe);
export const ZapIcon = withProps(Zap);
export const WavesIcon = withProps(Waves);
export const VenetianMaskIcon = withProps(VenetianMask);
export const FlowerIcon = withProps(Flower2);
export const RepeatIcon = withProps(Repeat);
export const LanguagesIcon = withProps(Languages);
export const RotateCwIcon = withProps(RotateCw);
export const BookIcon = withProps(BookOpen);
export const TrashIcon = withProps(Trash2);
export const CloseIcon = withProps(X);
export const PlusIcon = withProps(Plus);
export const PaletteIcon = withProps(Palette);
export const SearchIcon = withProps(Search);
export const CheckIcon = withProps(Check);
export const CursorIcon = withProps(MousePointer2);
export const SparklesIcon = withProps(Sparkles);
export const ChevronRightIcon = withProps(ChevronRight);
