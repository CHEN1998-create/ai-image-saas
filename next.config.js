/** @type {import('next').NextConfig} */
const nextConfig = {
  // 骨架阶段：使用 <img> 占位图，忽略 ESLint 构建阻塞
  eslint: { ignoreDuringBuilds: true },
  webpack: (config, { isServer }) => {
    // undici/fetch-socks 保持原生 require（打包会破坏 socks dispatcher 连接器）
    if (isServer) {
      config.externals = [
        ...config.externals,
        /^undici($|\/)/,
        /^fetch-socks($|\/)/
      ];
    }
    return config;
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "source.unsplash.com" }
    ]
  }
};

module.exports = nextConfig;
