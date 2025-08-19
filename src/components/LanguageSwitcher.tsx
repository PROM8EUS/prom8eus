'use client';

import { useNavigate, useSearchParams } from 'react-router-dom';
import { DICT } from '@/lib/i18n/dict';

interface LanguageSwitcherProps {
  current: "de" | "en";
}

export default function LanguageSwitcher({ current }: LanguageSwitcherProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleLanguageSwitch = () => {
    const newLang = current === "de" ? "en" : "de";
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('lang', newLang);
    
    // Navigate to current page with updated language parameter
    navigate(`?${newSearchParams.toString()}`, { replace: true });
  };

  return (
    <button
      onClick={handleLanguageSwitch}
      className="fixed bottom-4 right-4 border px-2 py-1 rounded bg-background hover:bg-accent transition-colors"
    >
      {DICT[current].lang_switch}
    </button>
  );
}