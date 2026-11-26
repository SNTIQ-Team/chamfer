import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import Shell from '@/core/shell/Shell';
import { htmlLang, LANG_COOKIE, pickLanguage } from '@/core/i18n/config';
import './globals.css';
import './tools.css';

export const metadata: Metadata = { title: 'SNTIQ Chamfer', description: 'Draft letters to German authorities and courts, find the recipient, and export to PDF or DOCX.' };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [preferences, request] = await Promise.all([cookies(), headers()]);
  const lang = pickLanguage(preferences.get(LANG_COOKIE)?.value, request.get('accept-language'));
  return <html lang={htmlLang(lang)} suppressHydrationWarning><body>
    <Shell initialLang={lang}>{children}</Shell>
  </body></html>;
}
