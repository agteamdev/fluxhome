import { defineWebExtConfig } from 'wxt';

// Only used by `npm run dev` (auto-launches the browser).
// Find the Brave path with: which brave-browser
export default defineWebExtConfig({
  binaries: {
    chrome: '/usr/bin/brave-browser',
  },
});
