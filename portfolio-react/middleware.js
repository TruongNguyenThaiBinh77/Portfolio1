import { NextResponse } from 'next/server';

const locales = ['vi', 'en'];
const defaultLocale = 'vi';

export function middleware(request) {
  try {
    const { pathname } = request.nextUrl;
    
    // Exclude static assets, api, next internals, etc.
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api') ||
      pathname.startsWith('/assets') ||
      pathname.includes('.')
    ) {
      return NextResponse.next();
    }

    const pathnameHasLocale = locales.some(
      (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );

    if (pathnameHasLocale) {
      // Save the preferred locale to cookie
      const locale = pathname.split('/')[1] || pathname.replace('/', '');
      const response = NextResponse.next();
      if (locale) {
        response.cookies.set('NEXT_LOCALE', locale);
      }
      return response;
    }

    // Redirect if there is no locale
    const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
    const locale = cookieLocale && locales.includes(cookieLocale) ? cookieLocale : defaultLocale;

    const newUrl = request.nextUrl.clone();
    newUrl.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
    return NextResponse.redirect(newUrl);
  } catch (error) {
    console.error('Middleware execution error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    // Skip all internal paths (_next)
    '/((?!_next|api|assets|favicon.ico).*)',
  ],
};
