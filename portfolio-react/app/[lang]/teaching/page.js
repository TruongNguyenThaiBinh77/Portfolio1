import { redirect } from 'next/navigation';

export default async function TeachingRedirect({ params }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang || 'vi';
  redirect(`/${lang}/achievements`);
}
