import type { NextConfig } from "next";

// Google sign-in lives at <project>.firebaseapp.com/__/auth/*. Serving it on
// our own domain keeps Safari from blocking it as third-party storage.
const firebaseAuthHost = `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`;

const nextConfig: NextConfig = {
  devIndicators: false,
  async rewrites() {
    return [
      { source: "/__/auth/:path*", destination: `https://${firebaseAuthHost}/__/auth/:path*` },
    ];
  },
  // Old static page names, kept for bookmarks.
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/links.html", destination: "/links", permanent: true },
    ];
  },
};

export default nextConfig;
