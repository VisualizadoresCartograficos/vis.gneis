export default {
    output: 'standalone', // REQUIRED for Docker standalone copy
    devIndicators: false,
    basePath: '/gneis',
    assetPrefix: '/gneis', // ⚠️ EXTREMELY IMPORTANT WHEN DEPLOYING TO PRODUCTION, STATICS MUST BE DIRECTED TO THE VIEWER REGISTERED PATH
    allowedDevOrigins: ['10.67.33.20'],
    reactStrictMode: false
};