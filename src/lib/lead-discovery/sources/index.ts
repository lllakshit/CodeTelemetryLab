import type { DiscoverySource } from "../types.ts"
import { FEEDS, feedSource } from "./feeds.ts"
import { hnHiringSource, hnLaunchSource } from "./hn.ts"
import { serperSource, tavilySource } from "./web-search.ts"

/**
 * Every discovery source, primary first. To add one (for example a Google Maps / local-business adapter for SMB
 * prospects), implement DiscoverySource and append it here; it then gets its share of the daily candidate budget.
 */
export function allSources(): DiscoverySource[] {
  return [hnLaunchSource, ...FEEDS.map(feedSource), hnHiringSource, tavilySource, serperSource]
}
