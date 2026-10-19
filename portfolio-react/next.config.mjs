import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(__dirname, '../'),
  outputFileTracingIncludes: {
    '/**': [
      './content/**/*',
      '../_config.yml',
      '../_data/**/*',
      '../_pages/**/*',
      '../_news/**/*',
      '../_teachings/**/*',
      '../_bibliography/**/*',
    ],
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/vi',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
