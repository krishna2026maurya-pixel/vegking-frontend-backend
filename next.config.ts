import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com',            pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com',           pathname: '/**' },
      { protocol: 'https', hostname: '*.unsplash.com',                pathname: '/**' },
      { protocol: 'https', hostname: '5.imimg.com',                   pathname: '/**' },
      { protocol: 'https', hostname: '*.imimg.com',                   pathname: '/**' },
      { protocol: 'https', hostname: 'encrypted-tbn0.gstatic.com',   pathname: '/**' },
      { protocol: 'https', hostname: '*.gstatic.com',                 pathname: '/**' },
      { protocol: 'https', hostname: 'images.hindustantimes.com',     pathname: '/**' },
      { protocol: 'https', hostname: '*.hindustantimes.com',          pathname: '/**' },
      { protocol: 'https', hostname: 'images.pexels.com',             pathname: '/**' },
      { protocol: 'https', hostname: '*.pexels.com',                  pathname: '/**' },
      { protocol: 'https', hostname: 'upload.wikimedia.org',          pathname: '/**' },
      { protocol: 'https', hostname: 'i.imgur.com',                   pathname: '/**' },
      { protocol: 'https', hostname: 'cdn.pixabay.com',               pathname: '/**' },
      { protocol: 'https', hostname: '*.amazonaws.com',               pathname: '/**' },
      { protocol: 'https', hostname: '*.googleusercontent.com',       pathname: '/**' },
    ],
  },
};

export default nextConfig;
