import { useSafeUser as useUser } from "../../hooks/useSafeUser";
// Apply a dev-only router patch early to guard against undefined navigation targets
if (process.env.NODE_ENV !== 'production') {
  try {
    require('../../lib/patchRouter');
  } catch (e) {
    // ignore
  }
}
// Mount a small dev-only sitemap inspector to dump any invalid filename/href
if (process.env.NODE_ENV !== 'production') {
  try {
    // eslint-disable-next-line global-require
    const SitemapDebugger = require('../../lib/SitemapDebugger').default;
    // render as a side-effect component when the layout loads
    // We can't call hooks here, so we'll inject a lightweight global render
    // by attaching to the window (only in dev). The component will be picked
    // up by the runtime when the root layout renders.
    global.__SITEMAP_DEBUGGER = SitemapDebugger;
  } catch (e) {
    // ignore
  }
}
import { Redirect } from "expo-router";
import Stack from "expo-router/stack";

export default function Layout() {
  const { isSignedIn, isLoaded } = useUser();

  // If the dev sitemap debugger was registered above, render it so it can
  // inspect the sitemap and print diagnostics.
  const DevSitemap = global.__SITEMAP_DEBUGGER;

  if (!isLoaded) return null; // this is for a better ux

  if (!isSignedIn) {
    const href = '/sign-in';
    // Defensive: ensure href is a string
    if (typeof href === 'string') return <Redirect href={href} />;
    return null;
  }

  return (
    <>
      {DevSitemap ? <DevSitemap /> : null}
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}