/** @type {import('next').NextConfig} */
const backendUrl = process.env.BACKEND_URL || (process.env.VERCEL
	? 'https://shilp-backend-dusky.vercel.app'
	: 'http://localhost:8081');

const nextConfig = {
	async rewrites() {
		return [{ source: '/api/:path*', destination: `${backendUrl}/api/:path*` }];
	},
};

export default nextConfig;