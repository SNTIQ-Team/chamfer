import { fileURLToPath } from 'node:url';

/** @type {import('next').NextConfig} */
const config = {
  outputFileTracingRoot: fileURLToPath(new URL('.', import.meta.url)),
  experimental: { cpus: 2 },
  poweredByHeader: false,
  reactStrictMode: true,
  htmlLimitedBots: /.*/,
};

export default config;
