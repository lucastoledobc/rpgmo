import type {Metadata} from "next";
import "@/css/globals.css";

export const metadata: Metadata = {
  title: "RPG_MO",
  description: "Jogue RPG com amigos",
};

const alternarTema = () => {
  const root = document.documentElement;
  const novoTema = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  root.setAttribute('data-theme', novoTema);
};

export default function RootLayout({children,}: 
  Readonly<{children: React.ReactNode;}>) {
  return (
    <html
      lang="pt-br"
    >
      <body>{children}</body>
    </html>
  );
}
