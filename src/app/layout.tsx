import type {Metadata} from "next";
import "@/css/globals.css";
import ThemeSwitcher from "@/components/ThemeSwitcher";

export const metadata: Metadata = {
  title: "RPG_MO",
  description: "Jogue RPG com amigos",
  applicationName: "RPGMO",
  authors: {name: "Lucas Toledo"},
  keywords: "nextjs, rpg, ai",
  creator: "Lucas Toledo"
};

// Aplica o tema salvo antes da primeira pintura da página, evitando o "flash" do tema padrão seguido pelo tema escolhido.
const themeScript = `
(function () {
  try {
    var theme = localStorage.getItem('theme') || 'retro';
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
})();
`;

export default function RootLayout({children,}:
  Readonly<{children: React.ReactNode;}>) {
  return (
    <html lang="pt-br" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{__html: themeScript}} />
      </head>
      <body suppressHydrationWarning>
        <ThemeSwitcher />
        {children}
      </body>
    </html>
  );
}