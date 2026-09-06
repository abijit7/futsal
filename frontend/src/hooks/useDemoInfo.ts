import { useEffect, useState } from 'react';
import { demoApi } from '../api/modules';
import type { DemoInfo } from '../types/api';

/**
 * Cached across the whole session: the answer cannot change without a redeploy, and both the
 * sign-in page and the checkout ask for it. Holding the promise rather than the value also means
 * two components mounting together share one request.
 */
let cached: Promise<DemoInfo | null> | null = null;

function load() {
  if (!cached) {
    // A demo hint is decoration. If the endpoint is unreachable the page must still work, so a
    // failure resolves to null rather than rejecting.
    cached = demoApi.info().catch(() => null);
  }
  return cached;
}

/** Exported for tests, which must not inherit another test's cached answer. */
export function resetDemoInfoCache() {
  cached = null;
}

/**
 * Returns the demo configuration, or null while it is loading, if it could not be fetched, or if
 * this deployment is not a demo. Callers can therefore treat null as "show nothing".
 */
export function useDemoInfo(): DemoInfo | null {
  const [demo, setDemo] = useState<DemoInfo | null>(null);

  useEffect(() => {
    let active = true;
    load().then((info) => {
      if (active && info?.enabled) setDemo(info);
    });
    return () => { active = false; };
  }, []);

  return demo;
}
