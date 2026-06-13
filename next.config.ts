import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },

  // Security headers
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.vindi.com.br https://app.zapsign.com.br",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");

    const securityHeaders = [
      { key: "Content-Security-Policy",    value: csp },
      { key: "X-Frame-Options",            value: "DENY" },
      { key: "X-Content-Type-Options",     value: "nosniff" },
      { key: "Referrer-Policy",            value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy",         value: "camera=(), microphone=(), geolocation=()" },
      { key: "Strict-Transport-Security",  value: "max-age=63072000; includeSubDomains; preload" },
      { key: "X-DNS-Prefetch-Control",     value: "off" },
    ];

    // Override para rotas de PDF — permite iframe same-origin
    const pdfHeaders = securityHeaders
      .filter(h => h.key !== 'X-Frame-Options' && h.key !== 'Content-Security-Policy')
      .concat([
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'Content-Security-Policy', value: csp.replace("frame-ancestors 'none'", "frame-ancestors 'self'") },
      ]);

    // Wildcard primeiro; regra específica do PDF por ÚLTIMO para sobrescrever
    // X-Frame-Options e frame-ancestors, permitindo iframe same-origin no admin.
    return [
      { source: "/(.*)", headers: securityHeaders },
      { source: "/api/contratos/(.*)/pdf", headers: pdfHeaders },
    ];
  },
};

export default nextConfig;
