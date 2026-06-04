/** @type {import('next').NextConfig} */
const securityHeaders = [
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
