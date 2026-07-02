import type { Metadata } from "next";
import "@/css/globals.css";

export const metadata: Metadata = {
  title: "RPG_MO",
  description: "Jogue RPG com amigos",
};

export default function RootLayout({children,}: 
  Readonly<{children: React.ReactNode;}>) {
  return (
    <html
      lang="pt-br"
    >
      <body className="body">{children}</body>
    </html>
  );
}
