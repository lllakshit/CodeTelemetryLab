/** Reading a buying signal from a headline: kind, company name and a cheap relevance pre-score. Pure. */
import type { Candidate, Region, SignalKind } from "./types.ts"

const FUNDING = /\b(raises?|raised|secures?|secured|lands?|closes?|closed|bags?|nabs?|snags?|banks?|gets?|receives?|picks up|scores?)\b[^.]{0,60}?(\$|£|€|₹|aed|usd|inr|cad|aud|\d+(\.\d+)?\s?(m|mn|million|bn|billion|cr|crore|lakh|k)\b)|\b(seed|pre-seed|series [a-e]|funding round|fundraise|investment round|venture round)\b/i
const LAUNCH = /\b(launch(es|ed)?|unveils?|debuts?|introduces?|rolls out|releases?|opens? (beta|access)|goes live|now available|public beta|launch hn)\b/i
const PARTNER = /\b(partners? with|partnership|integrat(es|ion|ed) with|teams up|joins forces|alliance)\b/i
const HIRING = /\b(hiring|is hiring|we'?re hiring|join (our|the) team|founding engineer|first engineer|engineers? wanted)\b/i
const GROWTH = /\b(expands?|expansion|scales?|doubles|triples|growth|grows|customers|arr|revenue|enters?)\b/i
const WORKFLOW = /\b(manual(ly)?|spreadsheets?|bottleneck|legacy|migrat(e|ion)|automat(e|ion)|backlog|struggl\w*|outage|downtime)\b/i

/** Words that suggest the company is a services seller like us, a big incumbent, or not a buyer at all. */
const NOT_A_BUYER = /\b(agency|consultancy|consulting firm|dev shop|outsourcing|staffing|recruitment firm|systems integrator|it services|software house|freelance)\b/i
const OFF_TOPIC = /\b(ipo|lawsuit|sues|sued|layoffs?|lays off|shuts down|shutting down|bankrupt|acquired by|fraud|probe|arrested|scandal|obituary|podcast|webinar|opinion|op-ed|newsletter|roundup|week in review|this week)\b/i
const ICP = /\b(saas|b2b|api|platform|software|ai|machine learning|ml|llm|agent|automation|workflow|dashboard|data|analytics|fintech|healthtech|edtech|proptech|insurtech|legaltech|logistics|marketplace|developer|cloud|startup|app)\b/i
const SMALL_ROUND = /\b(pre-seed|seed|series a|angel)\b/i
const BIG_ROUND = /\b(series [d-z]|\$?\d{3,}\s?(m|million)\b|\bbn\b|billion)\b/i

export function classifySignal(text: string, fallback: SignalKind = "growth"): SignalKind {
  if (FUNDING.test(text)) return "funding"
  if (HIRING.test(text)) return "hiring"
  if (LAUNCH.test(text) || PARTNER.test(text)) return "launch"
  if (WORKFLOW.test(text)) return "workflow"
  if (GROWTH.test(text)) return "growth"
  return fallback
}

/** Is this headline a buying signal at all (not an opinion piece, round-up or court case)? */
export function isSignalHeadline(text: string): boolean {
  if (OFF_TOPIC.test(text)) return false
  return FUNDING.test(text) || LAUNCH.test(text) || PARTNER.test(text) || HIRING.test(text) || GROWTH.test(text) || WORKFLOW.test(text)
}

const VERB = /\s+(?:raises?|raised|secures?|secured|lands?|closes?|bags?|nabs?|snags?|banks?|gets?|receives?|picks up|launch(?:es)?|unveils?|debuts?|introduces?|rolls out|releases?|partners? with|teams up|expands?|opens?|hires?|is hiring|announces?)\b/i
const DESCRIPTOR = /\b(?:startup|start-up|company|firm|platform|group|maker|provider|unicorn|giant|operator|scaleup|scale-up|specialist|player|marketplace|venture)\s+(?=\S)/gi
const CONNECTORS = new Set(["and", "of", "the", "for", "de", "la", "le", "von", "van", "du", "y"])
const NOT_A_NAME = /^(how|why|what|when|where|who|which|can|could|will|would|should|is|are|do|does|did|this|these|those|the|a|an|exclusive|report|watch|startup|startups|investors?|vcs?|founders?|here|inside|meet)$/i

/**
 * Company named at the start of a news headline ("Acme AI raises $4M seed…" -> "Acme AI",
 * "Saudi tech group iMENA secures…" -> "iMENA"). Returns null when the headline does not start with a name followed
 * by a signal verb (questions, opinion pieces, market reports), so nothing is guessed.
 */
export function companyFromHeadline(title: string): string | null {
  const clean = title.replace(/^(exclusive|breaking|funding|scoop|report|update)\s*[:|–-]\s*/i, "").trim()
  if (clean.includes("?")) return null
  const verb = VERB.exec(clean)
  if (!verb || verb.index < 2 || verb.index > 80) return null
  let name = clean.slice(0, verb.index).replace(/,\s[^,]{2,80},$/, "").trim()
  if (/[:;"“”]/.test(name) || /\d\s?%/.test(name)) return null
  // "Verafin alum-led Verlo", "YC-backed Acme", "Dubai-based Acme"
  name = name.replace(/^.*\b[\w.]+-(?:led|backed|based|founded|born|focused|powered|owned)\s+/i, "")
  // "Toronto's Acme", "Sudan's Cashi"
  name = name.replace(/^(?:[A-Z][\w.-]*\s){0,2}[A-Z][\w.-]*['’]s\s+/, "")
  // "Physical AI company Promise Robotics", "Saudi tech group iMENA"
  let last = -1
  for (const match of name.matchAll(DESCRIPTOR)) last = (match.index ?? 0) + match[0].length
  if (last > 0) name = name.slice(last)
  name = name.replace(/['’]s$/, "").trim()
  const words = name.split(/\s+/).filter(Boolean)
  if (!words.length || words.length > 5 || name.length < 2 || name.length > 60) return null
  if (NOT_A_NAME.test(words[0])) return null
  // A plain lower-case word ("jumps", "tech") means this is a phrase, not a name. Brands like "iMENA" have capitals.
  if (words.some((word) => /^[a-z]{4,}$/.test(word) && !CONNECTORS.has(word))) return null
  return name
}

export function regionFromText(text: string, fallback: Region = "GLOBAL"): Region {
  const value = text.toLowerCase()
  if (/\b(uae|dubai|abu dhabi|sharjah|emirates|riyadh|saudi|gcc|mena)\b/.test(value)) return "AE"
  if (/\b(india|bengaluru|bangalore|mumbai|delhi|gurugram|gurgaon|noida|pune|hyderabad|chennai|jaipur|kolkata|ahmedabad)\b/.test(value)) return "IN"
  if (/\b(australia|sydney|melbourne|brisbane|perth|adelaide|canberra|new zealand|auckland)\b/.test(value)) return "AU"
  if (/\b(canada|toronto|vancouver|montreal|montréal|ottawa|calgary|waterloo|edmonton)\b/.test(value)) return "CA"
  if (/\b(uk|united kingdom|london|manchester|edinburgh|bristol|cambridge|oxford|leeds|birmingham|glasgow|britain|british)\b/.test(value)) return "UK"
  if (/\b(us|usa|united states|san francisco|new york|nyc|boston|austin|seattle|los angeles|chicago|miami|denver|bay area|silicon valley|remote \(us\))\b/.test(value)) return "US"
  return fallback
}

export function ageInDays(isoDate: string, now: Date): number {
  const time = Date.parse(isoDate)
  if (!Number.isFinite(time)) return Number.POSITIVE_INFINITY
  return Math.max(0, (now.getTime() - time) / 86_400_000)
}

/**
 * Cheap 0-100 relevance score used only to decide which candidates are worth fetching and sending to the model.
 * It never decides whether a prospect is saved.
 */
export function preScore(candidate: Candidate, now: Date): number {
  const text = `${candidate.title} ${candidate.summary}`
  let score = 30
  score += { funding: 25, launch: 18, hiring: 14, growth: 10, workflow: 16 }[candidate.signalKind]
  if (ICP.test(text)) score += 15
  if (candidate.signalKind === "funding" && SMALL_ROUND.test(text)) score += 10
  if (BIG_ROUND.test(text)) score -= 15
  if (PARTNER.test(text) || /\b(api|integration|dashboard|automation|ai agent|agents?)\b/i.test(text)) score += 8
  if (/\b(founding engineer|first engineer|small team|contract|contractor|freelance|part[- ]time)\b/i.test(text)) score += 6
  if (NOT_A_BUYER.test(text)) score -= 30
  if (OFF_TOPIC.test(text)) score -= 40
  if (candidate.region !== "GLOBAL") score += 4
  if (candidate.websiteUrl) score += 5
  const age = ageInDays(candidate.signalDate, now)
  if (age <= 7) score += 8
  else if (age > 30) score -= 10
  return Math.max(0, Math.min(100, score))
}

export function looksLikeServiceSeller(text: string): boolean {
  return NOT_A_BUYER.test(text)
}
