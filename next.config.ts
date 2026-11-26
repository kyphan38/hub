import type { NextConfig } from "next";

// Google sign-in lives at <project>.firebaseapp.com/__/auth/*. Serving it on
// our own domain keeps Safari from blocking it as third-party storage.
const firebaseAuthHost = `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`;

const nextConfig: NextConfig = {
  devIndicators: false,
  async rewrites() {
    return {
      // The home and links pages stay plain static HTML in public/.
      beforeFiles: [
        { source: "/", destination: "/index.html" },
        { source: "/links", destination: "/links.html" },
      ],
      afterFiles: [
        { source: "/__/auth/:path*", destination: `https://${firebaseAuthHost}/__/auth/:path*` },
      ],
      fallback: [],
    };
  },
};

export default nextConfig;
