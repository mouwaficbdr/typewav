/**
 * JsonLd : injecte un bloc JSON-LD structuré dans le <head>.
 * Server Component : pas de JavaScript côté client.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
