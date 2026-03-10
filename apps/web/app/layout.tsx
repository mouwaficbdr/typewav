import { MilestoneToast } from '@/components/progression/MilestoneToast';
import { fontDisplay, fontMono, fontUi } from '@/lib/fonts';
import '@/styles/globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TypeWav — Immersive Musical Typing',
  description:
    'TypeWav est un outil de typing immersif et musical. Chaque frappe produit une note. Chaque séance devient une composition.',
  keywords: ['typing', 'music', 'wpm', 'monkeytype', 'open source'],
};

/**
 * Root layout — Server Component.
 * Les variables CSS des polices sont injectées ici pour
 * être disponibles dans le @theme de globals.css.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${fontDisplay.variable} ${fontUi.variable} ${fontMono.variable}`}
    >
      <body>
        {children}
        <MilestoneToast />
      </body>
    </html>
  );
}
