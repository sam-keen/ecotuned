// Global setup for Playwright tests
// Ensures TransformStream is available in the test environment

export default function globalSetup() {
  // TransformStream should be available in Node 18+, but Playwright MCP needs it globally
  if (typeof global.TransformStream === 'undefined') {
    // Import from web-streams-polyfill if needed, or use Node's native implementation
    const { TransformStream } = require('stream/web')
    global.TransformStream = TransformStream
  }
}
