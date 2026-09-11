module.exports = {
  onPostBuild: async ({ utils }) => {
    const fs = require('fs');
    const path = require('path');
    const nodeMiddlewarePath = path.join(
      process.cwd(),
      '.netlify',
      'edge-functions',
      '___netlify-edge-handler-node-middleware',
      'server',
      'node-middleware.js'
    );
    if (fs.existsSync(nodeMiddlewarePath)) {
      // Replace with a simple no-op middleware to avoid require path issues
      fs.writeFileSync(nodeMiddlewarePath, 'export default function handler(req) { return new Response(null, { status: 200 }); }\n');
      console.log('Replaced node-middleware.js with no-op to avoid bundling issues');
    }
  },
};
