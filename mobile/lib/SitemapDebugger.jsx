import React, { useEffect } from 'react';
import { useSitemap } from 'expo-router';

// Dev-only helper: traverses the sitemap produced by expo-router and logs
// any nodes that have missing/invalid `filename` or `href` values. This
// avoids editing node_modules and gives us a deterministic runtime dump
// during Metro bundling / app startup.
export default function SitemapDebugger() {
  const sitemap = useSitemap();

  useEffect(() => {
    if (!sitemap) {
      console.warn('[SitemapDebugger] sitemap is null or not ready yet');
      return;
    }

    let total = 0;
    const problems = [];

    function countAndCheck(node, parents = []) {
      total += 1;
      if (typeof node.filename !== 'string') {
        problems.push({ kind: 'filename', contextKey: node.contextKey, filename: node.filename, parents });
        console.error(`[SitemapDebugger] invalid filename for node ${node.contextKey}:`, node.filename);
      }
      if (typeof node.href !== 'string') {
        problems.push({ kind: 'href', contextKey: node.contextKey, href: node.href, parents });
        console.error(`[SitemapDebugger] invalid href for node ${node.contextKey}:`, node.href);
      }
      if (Array.isArray(node.children)) {
        node.children.forEach((c) => countAndCheck(c, parents.concat(node.contextKey)));
      }
    }

    try {
      countAndCheck(sitemap, []);
      if (!problems.length) {
        console.log(`[SitemapDebugger] sitemap OK — ${total} nodes. Sample root contextKey=${sitemap.contextKey}`);
      } else {
        console.warn(`[SitemapDebugger] found ${problems.length} sitemap problems; see errors above. Dumping sitemap:`);
        console.log(sitemap);
      }
    } catch (e) {
      console.error('[SitemapDebugger] failed to inspect sitemap:', e);
    }
  }, [sitemap]);

  return null;
}
