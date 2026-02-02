/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Evitar pre-renderizado estático de páginas con autenticación
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
};

export default nextConfig;
