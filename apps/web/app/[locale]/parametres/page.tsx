import { buildMetadata } from '@/lib/seo';
import { getTranslations } from 'next-intl/server';
import { ParametresClient } from './ParametresClient';

export async function generateMetadata() {
  const t = await getTranslations('settings');
  return buildMetadata({
    title: `${t('title')} — TypeWav`,
  });
}

export default function ParametresPage() {
  return <ParametresClient />;
}
