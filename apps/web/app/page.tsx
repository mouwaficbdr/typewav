import { TypingArea } from '@/components/typing/TypingArea';
import { litteratureCollection } from '@typewav/collections';

/**
 * Page d'accueil — Server Component.
 * Le texte est sélectionné côté serveur depuis la collection littérature.
 * La zone de frappe interactive est un Client Component.
 */
export default function HomePage() {
  // Sélection déterministe du premier texte de la collection littérature
  // (côté serveur — pas de Math.random() pour éviter les hydration mismatches)
  const entry = litteratureCollection.texts[0]!;
  const text = entry.content;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 p-8">
      <header className="text-center">
        <h1
          className="text-5xl font-light tracking-widest"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--color-accent)',
          }}
        >
          TypeWav
        </h1>
        <p
          className="mt-2 text-sm tracking-widest uppercase"
          style={{
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-ui)',
          }}
        >
          immersive musical typing
        </p>
      </header>

      <TypingArea
        text={text}
        collectionId={litteratureCollection.id}
        mode="classic"
      />

      <p
        className="text-xs"
        style={{
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-ui)',
        }}
      >
        {entry.source}
      </p>
    </main>
  );
}
