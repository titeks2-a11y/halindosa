/** @type {import('next').NextConfig} */
const isDevelopment = process.env.NODE_ENV === "development";
const scriptSrc = isDevelopment ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : "script-src 'self' 'unsafe-inline'";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "form-action 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' https: http: data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "worker-src 'self' blob:",
      "manifest-src 'self'"
    ].join("; ")
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload"
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on"
  },
  {
    key: "X-Frame-Options",
    value: "DENY"
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff"
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin"
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()"
  }
];

const isCapacitorBuild = process.env.CAPACITOR_BUILD === "true";

const nextConfig = {
  output: isCapacitorBuild ? "export" : "standalone",
  trailingSlash: isCapacitorBuild,
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    unoptimized: true
  },
  poweredByHeader: false,
  ...(isCapacitorBuild
    ? {}
    : {
        async headers() {
          return [
            {
              source: "/:path*",
              headers: securityHeaders
            }
          ];
        }
      })
};

export default nextConfig;
