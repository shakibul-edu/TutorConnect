/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      // Backend will provide full URLs, so we allow common image CDNs
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
      },
      {
        protocol: 'https',
        hostname: 'illustrations.popsy.co',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      // Add your backend domain pattern here if needed
      ...(() => {
        const rawBackendUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL;
        if (!rawBackendUrl) return [];
        const backendUrl = new URL(rawBackendUrl);
        return [
          {
            protocol: backendUrl.protocol.replace(':', ''),
            hostname: backendUrl.hostname,
            ...(backendUrl.port ? { port: backendUrl.port } : {}),
          },
        ];
      })(),
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  async headers() {
    const backendUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || 'http://localhost:8000';
    
    return [
      // Static assets with long cache
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // API routes - no cache
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
      // Images with moderate cache
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, must-revalidate',
          },
        ],
      },
      // Default headers for all routes
      {
        source: '/(.*)',
        headers: [
          // Enable FedCM feature for identity-credentials-get
          {
            key: 'Permissions-Policy',
            value: 'identity-credentials-get=(self "https://accounts.google.com")',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Development-friendly CSP allowing Google Identity Services and HMR
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://www.gstatic.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com https://www.gstatic.com",
              `img-src 'self' data: https: ${backendUrl}`,
              "font-src 'self' data: https://fonts.gstatic.com",
              `connect-src 'self' https://accounts.google.com https://www.googleapis.com https://www.gstatic.com ws: wss: http://localhost:3000 http://127.0.0.1:3000 ${backendUrl}`,
              "frame-src 'self' https://accounts.google.com",
              "frame-ancestors 'self'",
              "form-action 'self' https://accounts.google.com",
              "base-uri 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
