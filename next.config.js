/** @type {import('next').NextConfig} */
const nextConfig = {
  // 骨架阶段：使用 <img> 占位图，忽略 ESLint 构建阻塞
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "source.unsplash.com" }
    ]
  }
};

module.exports = nextConfig;
