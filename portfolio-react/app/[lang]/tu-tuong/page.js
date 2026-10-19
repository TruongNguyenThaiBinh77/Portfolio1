export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';

export default async function TuTuongRedirect({ params }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang || 'vi';
  redirect(lang === 'en' ? `/${lang}/partycell` : `/${lang}/chibo`);
}
