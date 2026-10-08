import fr from '@/messages/fr.json';

/** next-intl sur les vrais textes français : les tests vérifient la copie réelle. */
export const nextIntlFr = {
  useLocale: () => 'fr',
  useTranslations:
    (namespace: string) =>
    (key: string, values?: Record<string, unknown>) => {
      let msg: unknown = fr;
      for (const segment of `${namespace}.${key}`.split('.')) {
        msg = (msg as Record<string, unknown> | undefined)?.[segment];
      }
      if (typeof msg !== 'string') return `${namespace}.${key}`;
      return msg.replace(/\{(\w+)\}/g, (_m, token: string) => String(values?.[token] ?? ''));
    },
};
