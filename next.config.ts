// arquivo: automatiza o compilador e deixa mais independente. Vai crescer no futuro para projetos maiores.
// local: next.config.ts
 
import type {NextConfig} from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
};

export default nextConfig;
