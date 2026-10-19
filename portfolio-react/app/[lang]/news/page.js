import { redirect } from 'next/navigation';

export default async function NewsRedirect({ params }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang || 'vi';
  redirect(`/${lang}#news-section`);
}
