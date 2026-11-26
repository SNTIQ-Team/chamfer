'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { createI18nInstance } from '@/core/i18n';
import { htmlLang } from '@/core/i18n/config';
import { ThemeProvider } from './ThemeProvider';
import { ModuleActionsProvider, useModuleActionsHost } from './ModuleActions';

const languages = { de: 'Deutsch', en: 'English', ru: 'Русский', ua: 'Українська' };

function ChamferShell({ children }: { children: React.ReactNode }) {
  const { current } = useModuleActionsHost();
  const { i18n } = useTranslation();
  useEffect(() => { document.documentElement.lang = htmlLang(i18n.language); }, [i18n.language]);
  return <>
    <header className="tools-header">
      <Link href="/">SNTIQ Chamfer</Link>
      <select aria-label="Language" value={i18n.language} onChange={event => void i18n.changeLanguage(event.target.value)}>
        {Object.entries(languages).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
      </select>
      {current?.headerActions}
    </header>
    <main>{children}</main>
    {current?.footerNote && <footer className="tools-note">{current.footerNote}</footer>}
  </>;
}

export default function Shell({ initialLang, children }: { initialLang: string; children: React.ReactNode }) {
  const [i18n] = useState(() => createI18nInstance(initialLang));
  return <I18nextProvider i18n={i18n}><ThemeProvider><ModuleActionsProvider>
    <ChamferShell>{children}</ChamferShell>
  </ModuleActionsProvider></ThemeProvider></I18nextProvider>;
}
