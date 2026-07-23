/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  async redirects() {
    return [
      {
        source: "/rowing-results",
        destination: "/about",
        permanent: true
      },
      // 2021年のJARA表記変更に合わせて種目名を名寄せした際の旧URL救済
      ...[
        "男子ペア",
        "男子フォア",
        "男子クォドルプル",
        "女子ペア",
        "女子クォドルプル",
        "軽量級男子ペア",
        "軽量級女子ペア"
      ].map((event) => ({
        source: `/records/${encodeURIComponent(event.replace(/(男子|女子)/, "$1舵手なし"))}`,
        destination: `/records/${encodeURIComponent(event)}`,
        permanent: true
      }))
    ];
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }

    return config;
  }
};

export default nextConfig;
