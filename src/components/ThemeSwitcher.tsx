// arquivo: seletor de tema global
// local: src\components\ThemeSwitcher.tsx

'use client';
import {useEffect, useState} from 'react';

export const THEMES = [
  {value: 'retro', label: 'Retro (Padrão)'},
  {value: 'dark', label: 'Sombras'},
  {value: 'light', label: 'Claro'},
  {value: 'fantasia', label: 'Fantasia Medieval'},
  {value: 'cyberpunk', label: 'Cyberpunk' },
  {value: 'terror', label: 'Terror'},
  {value: 'ff', label: 'Arcano Azul'},
] as const;

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState('retro');

  // sincroniza com o tema já aplicado pelo script inline (evita flash)
  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme') || 'retro';
    setTheme(current);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const novoTema = e.target.value;
    setTheme(novoTema);
    document.documentElement.setAttribute('data-theme', novoTema);
    try {
      localStorage.setItem('theme', novoTema);
    }
    catch (err) {
      console.error('Não foi possível salvar o tema:', err);
    }
  };

  return (
    <div className="themeSwitcher">
      <span className="themeSwitcher__icon" aria-hidden="true">🎨</span>
      <select
        className="themeSwitcher__select"
        value={theme}
        onChange={handleChange}
        aria-label="Escolher tema"
      >
        {THEMES.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>
    </div>
  );
}