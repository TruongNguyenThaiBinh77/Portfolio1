export const dynamic = 'force-dynamic';
import { getPageContent, getConfig } from '../../../lib/config';
import TuTuongClient from '../tu-tuong/TuTuongClient';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang || 'en';
  const config = getConfig(lang);

  const title = lang === 'vi' 
    ? `Chi bộ | ${config.first_name || ''} ${config.last_name || ''}`.trim()
    : `Party Cell | ${config.first_name_en || config.first_name || ''} ${config.last_name_en || config.last_name || ''}`.trim();

  return {
    title: title || (lang === 'vi' ? 'Chi bộ' : 'Party Cell'),
    description: lang === 'vi' ? 'Trang Chi bộ - Tư tưởng Hồ Chí Minh' : 'Party Cell page - Ho Chi Minh Thought',
  };
}

export default async function PartyCellPage({ params }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang || 'en';
  const config = getConfig(lang);
  const { data: fm } = getPageContent('tu-tuong.md', lang);

  return <TuTuongClient lang={lang} fm={fm} config={config} />;
}
