import { useEffect, useRef } from "react";
import type { AnalyticsEventName } from "@geekbase-labs/shared-types";

import { trackEvent, type TrackEventPayload } from "./analytics";

// Records a funnel event once the screen is shown. `enabled` exists for screens
// whose payload arrives asynchronously (an order id, a loaded product) — the
// event waits rather than firing with half its data.
export function useTrackEvent(
  name: AnalyticsEventName,
  payload: TrackEventPayload = {},
  enabled = true,
): void {
  // One view is one event. Callers pass an inline payload object, so this effect
  // re-runs on every render — the guard, not the dependency list, is what keeps
  // the funnel's top from being inflated by re-renders.
  const fired = useRef(false);

  useEffect(() => {
    if (!enabled || fired.current) return;
    fired.current = true;
    void trackEvent(name, payload);
  }, [name, enabled, payload]);
}
