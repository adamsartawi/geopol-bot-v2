/**
 * GEOPOL-INT Automated Intelligence Pipeline
 *
 * Runs every 6 hours. Fetches from GDELT, ACLED, World Bank, IMF, UNHCR, EIA,
 * classifies events using the WRDI framework, and updates the knowledge base.
 */

import { nanoid } from "nanoid";
import { getDb } from "./db";
import { pipelineRuns, pipelineEvents, kbChangelog, countryProfiles, countryPairs, middleEastScenarios } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DB = any;

// ── Country mapping ──────────────────────────────────────────────────────────
const COUNTRY_IDS = ["US", "CN", "RU", "IL", "CA", "EU", "IR", "IN", "GCC"];
const COUNTRY_NAMES: Record<string, string> = {
  US: "United States", CN: "China", RU: "Russia",
  IL: "Israel", CA: "Canada", EU: "Europe",
  IR: "Iran", IN: "India", GCC: "Gulf States (GCC)",
};

// GDELT country codes mapped to our IDs
const GDELT_COUNTRY_MAP: Record<string, string> = {
  US: "US", USA: "US", CHN: "CN", RUS: "RU", ISR: "IL",
  CAN: "CA", EUN: "EU", GBR: "EU", DEU: "EU", FRA: "EU",
  IRN: "IR", IND: "IN", SAU: "GCC", UAE: "GCC", QAT: "GCC", KWT: "GCC", BHR: "GCC", OMN: "GCC",
};

// ── Source fetchers ──────────────────────────────────────────────────────────

/**
 * GDELT Project — real-time global news event database (free, no key required)
 * Returns events from the last 24 hours relevant to our 6 countries.
 */
async function fetchGDELT(): Promise<RawEvent[]> {
  const events: RawEvent[] = [];
  try {
    // GDELT GKG (Global Knowledge Graph) — last 15 minutes, updated every 15 min
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=country:${["US","China","Russia","Israel","Canada","Europe","Middle+East"].join("+OR+country:")}&mode=artlist&maxrecords=25&format=json&timespan=1440`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`GDELT HTTP ${res.status}`);
    const data = await res.json() as any;
    const articles = data?.articles ?? [];
    for (const a of articles.slice(0, 20)) {
      events.push({
        source: "GDELT",
        sourceUrl: a.url,
        title: a.title ?? "Untitled",
        summary: a.seendate ? `Published: ${a.seendate}. Domain: ${a.domain}` : "",
        eventDate: a.seendate ? new Date(a.seendate.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, "$1-$2-$3T$4:$5:$6Z")) : new Date(),
        rawData: a,
      });
    }
  } catch (e) {
    console.warn("[Pipeline] GDELT fetch failed:", (e as Error).message);
  }
  return events;
}

/**
 * ACLED — Armed Conflict Location & Event Data
 * Uses OAuth2 password grant (email + password) to get a bearer token,
 * then fetches the last 6 hours of conflict events globally.
 * Mirrors the official Python example provided by the ACLED team.
 */
async function fetchACLED(): Promise<RawEvent[]> {
  const events: RawEvent[] = [];
  const { acledEmail, acledPassword } = await import("./_core/env").then(m => m.ENV ? { acledEmail: m.ENV.acledEmail, acledPassword: m.ENV.acledPassword } : { acledEmail: process.env.ACLED_EMAIL ?? "", acledPassword: process.env.ACLED_PASSWORD ?? "" });

  if (!acledEmail || !acledPassword) {
    console.warn("[Pipeline] ACLED credentials not configured — skipping");
    return events;
  }

  try {
    // Step A: Request OAuth2 access token
    const authBody = new URLSearchParams({
      username: acledEmail,
      password: acledPassword,
      grant_type: "password",
      client_id: "acled",
    });
    const authRes = await fetch("https://acleddata.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: authBody.toString(),
      signal: AbortSignal.timeout(15000),
    });
    if (!authRes.ok) throw new Error(`ACLED auth failed: HTTP ${authRes.status}`);
    const authData = await authRes.json() as any;
    const accessToken = authData?.access_token;
    if (!accessToken) throw new Error("ACLED auth returned no access_token");
    console.log("[Pipeline] ACLED authenticated successfully");

    // Step B: Define 6-hour rolling window (use date only as ACLED accepts YYYY-MM-DD)
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const eventDateStr = sixHoursAgo.toISOString().split("T")[0]; // YYYY-MM-DD

    // Step C: Fetch armed conflict events
    const params = new URLSearchParams({
      event_date: eventDateStr,
      event_date_where: ">=",
      limit: "100",
      _format: "json",
    });
    const dataRes = await fetch(
      `https://acleddata.com/api/acled/read?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(20000),
      }
    );
    if (!dataRes.ok) throw new Error(`ACLED data fetch failed: HTTP ${dataRes.status}`);
    const data = await dataRes.json() as any;
    const acledEvents: any[] = data?.data ?? [];
    console.log(`[Pipeline] ACLED returned ${acledEvents.length} events since ${eventDateStr}`);

    for (const e of acledEvents.slice(0, 50)) {
      events.push({
        source: "ACLED",
        sourceUrl: `https://acleddata.com/data-export-tool/`,
        title: `${e.event_type ?? "Event"}: ${e.actor1 ?? "Unknown actor"} in ${e.country ?? "Unknown country"}`,
        summary: e.notes
          ?? `${e.event_type} involving ${e.actor1}${e.actor2 ? ` and ${e.actor2}` : ""} in ${e.location ?? ""}, ${e.country ?? ""}. Fatalities: ${e.fatalities ?? 0}.`,
        eventDate: e.event_date ? new Date(e.event_date) : new Date(),
        rawData: e,
      });
    }
  } catch (e) {
    console.warn("[Pipeline] ACLED fetch failed:", (e as Error).message);
  }
  return events;
}

/**
 * World Bank — macroeconomic indicators (free, no key required)
 */
async function fetchWorldBank(): Promise<RawEvent[]> {
  const events: RawEvent[] = [];
  try {
    // GDP growth latest values for our countries
    const countryMap: Record<string, string> = { US: "US", CN: "CN", RU: "RU", IL: "IL", CA: "CA" };
    const wbCodes = Object.entries(countryMap).map(([, v]) => v).join(";");
    const url = `https://api.worldbank.org/v2/country/${wbCodes}/indicator/NY.GDP.MKTP.KD.ZG?format=json&mrv=1&per_page=10`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`WB HTTP ${res.status}`);
    const data = await res.json() as any;
    const records = data?.[1] ?? [];
    for (const r of records) {
      if (!r.value) continue;
      const countryId = Object.entries(countryMap).find(([, v]) => v === r.countryiso3code)?.[0] ?? r.countryiso3code;
      events.push({
        source: "WorldBank",
        sourceUrl: `https://data.worldbank.org/indicator/NY.GDP.MKTP.KD.ZG?locations=${r.countryiso3code}`,
        title: `${r.country?.value}: GDP Growth ${r.value?.toFixed(1)}% (${r.date})`,
        summary: `World Bank reports ${r.country?.value} GDP growth at ${r.value?.toFixed(2)}% for ${r.date}. This is a key economic dimension indicator for WRDI scoring.`,
        eventDate: new Date(`${r.date}-01-01`),
        rawData: r,
      });
    }
  } catch (e) {
    console.warn("[Pipeline] World Bank fetch failed:", (e as Error).message);
  }
  return events;
}

/**
 * IMF World Economic Outlook — economic projections (free API)
 */
async function fetchIMF(): Promise<RawEvent[]> {
  const events: RawEvent[] = [];
  try {
    // IMF Data API — inflation rates for key countries
    const url = `https://www.imf.org/external/datamapper/api/v1/PCPIPCH/USA/CHN/RUS/ISR/CAN?periods=2024,2025`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`IMF HTTP ${res.status}`);
    const data = await res.json() as any;
    const values = data?.values?.PCPIPCH ?? {};
    const countryMap: Record<string, string> = { USA: "US", CHN: "CN", RUS: "RU", ISR: "IL", CAN: "CA" };
    for (const [imfCode, countryId] of Object.entries(countryMap)) {
      const countryData = values[imfCode];
      if (!countryData) continue;
      const years = Object.entries(countryData).sort(([a], [b]) => b.localeCompare(a));
      if (years.length === 0) continue;
      const [year, inflation] = years[0];
      events.push({
        source: "IMF",
        sourceUrl: "https://www.imf.org/external/datamapper/PCPIPCH",
        title: `${COUNTRY_NAMES[countryId] ?? countryId}: IMF Inflation Forecast ${Number(inflation).toFixed(1)}% (${year})`,
        summary: `IMF projects ${COUNTRY_NAMES[countryId] ?? countryId} inflation at ${Number(inflation).toFixed(2)}% for ${year}. High inflation constrains government spending and increases social pressure.`,
        eventDate: new Date(`${year}-01-01`),
        rawData: { imfCode, year, inflation },
      });
    }
  } catch (e) {
    console.warn("[Pipeline] IMF fetch failed:", (e as Error).message);
  }
  return events;
}

/**
 * UNHCR — refugee and displacement data (free API)
 */
async function fetchUNHCR(): Promise<RawEvent[]> {
  const events: RawEvent[] = [];
  try {
    const url = `https://api.unhcr.org/population/v1/population/?limit=10&sortBy=refugees&sortOrder=desc&yearFrom=2023&yearTo=2024`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`UNHCR HTTP ${res.status}`);
    const data = await res.json() as any;
    const items = data?.items ?? [];
    for (const item of items.slice(0, 5)) {
      if (!item.refugees || item.refugees < 100000) continue;
      events.push({
        source: "UNHCR",
        sourceUrl: "https://www.unhcr.org/refugee-statistics/",
        title: `${item.coa_name}: ${(item.refugees / 1e6).toFixed(2)}M refugees (${item.year})`,
        summary: `UNHCR reports ${item.coa_name} hosting ${item.refugees?.toLocaleString()} refugees in ${item.year}. Large refugee populations increase social dimension risk scores.`,
        eventDate: new Date(`${item.year}-06-01`),
        rawData: item,
      });
    }
  } catch (e) {
    console.warn("[Pipeline] UNHCR fetch failed:", (e as Error).message);
  }
  return events;
}

/**
 * EIA — US Energy Information Administration (free API)
 * Fetches weekly crude oil and natural gas data.
 */
async function fetchEIA(): Promise<RawEvent[]> {
  const events: RawEvent[] = [];
  try {
    // EIA weekly petroleum status
    const url = `https://api.eia.gov/v2/petroleum/pri/spt/data/?api_key=DEMO&frequency=weekly&data[0]=value&facets[product][]=EPCWTI&sort[0][column]=period&sort[0][direction]=desc&length=2`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`EIA HTTP ${res.status}`);
    const data = await res.json() as any;
    const records = data?.response?.data ?? [];
    if (records.length >= 2) {
      const latest = records[0];
      const prev = records[1];
      const change = ((latest.value - prev.value) / prev.value * 100).toFixed(2);
      const direction = latest.value > prev.value ? "rose" : "fell";
      events.push({
        source: "EIA",
        sourceUrl: "https://www.eia.gov/petroleum/",
        title: `WTI Crude ${direction} to $${latest.value?.toFixed(2)}/bbl (${change}% week-on-week)`,
        summary: `EIA reports WTI crude oil ${direction} from $${prev.value?.toFixed(2)} to $${latest.value?.toFixed(2)} per barrel. Oil price shifts directly affect Russia (budget), Gulf states (revenue), and US (inflation/energy policy).`,
        eventDate: new Date(latest.period),
        rawData: { latest, prev, change },
      });
    }
  } catch (e) {
    console.warn("[Pipeline] EIA fetch failed:", (e as Error).message);
  }
  return events;
}


/**
 * Regional news RSS feeds — state media and major outlets from Iran, Russia,
 * China, India, Gulf States, and the Middle East.
 * Uses a CORS-free server-side fetch; parses minimal RSS/Atom XML.
 */
const RSS_SOURCES: Array<{ name: string; url: string; country: string; bias: string; tier: "fast" | "full" }> = [
  // ── Cross-cutting international wires (fast tier — every 15 min) ──
  { name: "Reuters",       url: "https://feeds.reuters.com/reuters/topNews",                    country: "US",  bias: "independent", tier: "fast" },
  { name: "Reuters-World", url: "https://feeds.reuters.com/Reuters/worldNews",                  country: "US",  bias: "independent", tier: "fast" },
  { name: "Reuters-Biz",   url: "https://feeds.reuters.com/reuters/businessNews",               country: "US",  bias: "independent", tier: "fast" },
  { name: "AP",            url: "https://rsshub.app/apnews/topics/apf-intlnews",                country: "US",  bias: "independent", tier: "fast" },
  { name: "AP-Politics",   url: "https://rsshub.app/apnews/topics/apf-politics",                country: "US",  bias: "independent", tier: "fast" },
  { name: "Bloomberg",     url: "https://feeds.bloomberg.com/markets/news.rss",                 country: "US",  bias: "independent", tier: "fast" },
  { name: "Bloomberg-Pol", url: "https://feeds.bloomberg.com/politics/news.rss",                country: "US",  bias: "independent", tier: "fast" },
  { name: "CNBC",          url: "https://www.cnbc.com/id/100727362/device/rss/rss.html",        country: "US",  bias: "independent", tier: "fast" },
  { name: "CNBC-World",    url: "https://www.cnbc.com/id/100003114/device/rss/rss.html",        country: "US",  bias: "independent", tier: "fast" },
  { name: "FT",            url: "https://www.ft.com/rss/home/uk",                               country: "EU",  bias: "independent", tier: "fast" },
  { name: "Economist",     url: "https://www.economist.com/latest/rss.xml",                     country: "EU",  bias: "independent", tier: "fast" },
  { name: "WSJ",           url: "https://feeds.a.dj.com/rss/RSSWorldNews.xml",                  country: "US",  bias: "independent", tier: "fast" },
  { name: "WSJ-Markets",   url: "https://feeds.a.dj.com/rss/RSSMarketsMain.xml",                country: "US",  bias: "independent", tier: "fast" },
  // ── Israel (fast tier) ──
  { name: "TimesOfIsrael", url: "https://www.timesofisrael.com/feed/",                          country: "IL",  bias: "independent", tier: "fast" },
  { name: "JPost",         url: "https://www.jpost.com/rss/rssfeedsheadlines.aspx",             country: "IL",  bias: "independent", tier: "fast" },
  { name: "Haaretz",       url: "https://www.haaretz.com/cmlink/1.628765",                      country: "IL",  bias: "independent", tier: "fast" },
  { name: "i24News",       url: "https://www.i24news.com/i24news_rss.xml",                      country: "IL",  bias: "independent", tier: "fast" },
  // ── Iran (fast tier) ──
  { name: "IranIntl",      url: "https://www.iranintl.com/en/rss",                              country: "IR",  bias: "independent", tier: "fast" },
  { name: "IRNA",          url: "https://en.irna.ir/rss",                                       country: "IR",  bias: "state",       tier: "fast" },
  { name: "PressTV",       url: "https://www.presstv.ir/rss.xml",                               country: "IR",  bias: "state",       tier: "fast" },
  { name: "Mehr",          url: "https://en.mehrnews.com/rss",                                  country: "IR",  bias: "state",       tier: "fast" },
  // ── Russia (fast tier) ──
  { name: "MoscowTimes",   url: "https://www.themoscowtimes.com/rss/news",                      country: "RU",  bias: "independent", tier: "fast" },
  { name: "TASS",          url: "https://tass.com/rss/v2.xml",                                  country: "RU",  bias: "state",       tier: "fast" },
  { name: "RT",            url: "https://www.rt.com/rss/",                                      country: "RU",  bias: "state",       tier: "fast" },
  { name: "Sputnik",       url: "https://sputnikglobe.com/export/rss2/archive/index.xml",       country: "RU",  bias: "state",       tier: "fast" },
  // ── China (fast tier) ──
  { name: "SCMP",          url: "https://www.scmp.com/rss/91/feed",                             country: "CN",  bias: "independent", tier: "fast" },
  { name: "CaixinGlobal",  url: "https://www.caixinglobal.com/rss/",                            country: "CN",  bias: "independent", tier: "fast" },
  { name: "Xinhua",        url: "https://feeds.feedburner.com/xinhuanet/news",                  country: "CN",  bias: "state",       tier: "fast" },
  { name: "GlobalTimes",   url: "https://www.globaltimes.cn/rss/outbrain.xml",                  country: "CN",  bias: "state",       tier: "fast" },
  { name: "CGTN",          url: "https://www.cgtn.com/subscribe/rss/section/world.do",          country: "CN",  bias: "state",       tier: "fast" },
  // ── India (fast tier) ──
  { name: "TheHindu",      url: "https://www.thehindu.com/news/international/?service=rss",     country: "IN",  bias: "independent", tier: "fast" },
  { name: "NDTV",          url: "https://feeds.feedburner.com/ndtvnews-world-news",              country: "IN",  bias: "independent", tier: "fast" },
  // ── Gulf / Middle East (fast tier) ──
  { name: "AlJazeera",     url: "https://www.aljazeera.com/xml/rss/all.xml",                    country: "GCC", bias: "independent", tier: "fast" },
  { name: "ArabNews",      url: "https://www.arabnews.com/rss.xml",                             country: "GCC", bias: "independent", tier: "fast" },
  { name: "GulfNews",      url: "https://gulfnews.com/rss",                                     country: "GCC", bias: "independent", tier: "fast" },
];

/** Minimal RSS/Atom XML parser — extracts <item> or <entry> elements */
function parseRSSItems(xml: string, maxItems = 8): Array<{ title: string; link: string; pubDate: string; description: string }> {
  const items: Array<{ title: string; link: string; pubDate: string; description: string }> = [];
  // Match both RSS <item> and Atom <entry>
  const itemRegex = /<(?:item|entry)[^>]*>([\s\S]*?)<\/(?:item|entry)>/gi;
  let match: RegExpExecArray | null;
  while ((match = itemRegex.exec(xml)) !== null && items.length < maxItems) {
    const block = match[1];
    const title = (/<title[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/title>/.exec(block)?.[1] ||
                   /<title[^>]*>([^<]*)<\/title>/.exec(block)?.[1] || "").trim();
    const link  = (/<link[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/link>/.exec(block)?.[1] ||
                   /<link[^>]*href=["']([^"']+)["']/.exec(block)?.[1] ||
                   /<link[^>]*>([^<]*)<\/link>/.exec(block)?.[1] || "").trim();
    const pubDate = (/<pubDate[^>]*>([^<]*)<\/pubDate>/.exec(block)?.[1] ||
                     /<published[^>]*>([^<]*)<\/published>/.exec(block)?.[1] ||
                     /<updated[^>]*>([^<]*)<\/updated>/.exec(block)?.[1] || "").trim();
    const desc  = (/<description[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/description>/.exec(block)?.[1] ||
                   /<description[^>]*>([^<]*)<\/description>/.exec(block)?.[1] ||
                   /<summary[^>]*>([^<]*)<\/summary>/.exec(block)?.[1] || "").trim();
    if (title) items.push({ title, link, pubDate, description: desc.replace(/<[^>]+>/g, "").slice(0, 300) });
  }
  return items;
}

async function fetchRSSFeeds(): Promise<RawEvent[]> {
  const events: RawEvent[] = [];
  const results = await Promise.allSettled(
    RSS_SOURCES.map(async (src) => {
      const res = await fetch(src.url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; GeopolBot/1.0; +https://geopol.int)" },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const xml = await res.text();
      const items = parseRSSItems(xml, 6);
      return { src, items };
    })
  );
  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    const { src, items } = result.value;
    for (const item of items) {
      let eventDate: Date;
      try { eventDate = item.pubDate ? new Date(item.pubDate) : new Date(); }
      catch { eventDate = new Date(); }
      // Only include items from the last 48 hours
      if (Date.now() - eventDate.getTime() > 48 * 60 * 60 * 1000) continue;
      events.push({
        source: src.name,
        sourceUrl: item.link || src.url,
        title: item.title,
        summary: item.description || `From ${src.name} (${src.bias} media, ${COUNTRY_NAMES[src.country] ?? src.country})`,
        eventDate,
        rawData: { ...item, sourceName: src.name, sourceCountry: src.country, sourceBias: src.bias },
      });
    }
  }
  console.log(`[Pipeline] RSS feeds: ${events.length} articles from ${RSS_SOURCES.length} sources`);
  return events;
}

// ── Types ──────────────────────────────────────────────────────────
interface RawEvent {
  source: string;
  sourceUrl?: string;
  title: string;
  summary: string;
  eventDate: Date;
  rawData: unknown;
}

interface ClassifiedEvent {
  affectedCountries: string[];
  wrdiDimension: "political" | "military" | "economic" | "social" | "multiple";
  severityScore: number;
  relevanceScore: number;
  kbUpdates: KBUpdate[];
}

interface KBUpdate {
  entityType: "country_profile" | "country_pair" | "scenario";
  entityId: string;
  fieldName: string;
  newValue: string;
  reasoning: string;
}

// ── LLM Classification ───────────────────────────────────────────────────────
async function classifyEvent(event: RawEvent): Promise<ClassifiedEvent | null> {
  try {
    const prompt = `You are a geopolitical intelligence analyst using the WRDI (World Risk & Dynamics Index) framework.

Analyze this event and return a JSON classification:

EVENT:
Source: ${event.source}
Title: ${event.title}
Summary: ${event.summary}
Date: ${event.eventDate.toISOString().split("T")[0]}

WRDI DIMENSIONS:
- political (weight 25%): diplomatic incidents, elections, leadership changes, UN activity
- military (weight 30%): armed conflict, troop movements, arms deals, nuclear posturing
- economic (weight 25%): GDP, inflation, sanctions, trade, currency, commodities
- social (weight 20%): refugees, protests, human rights, food security, public health
- multiple: affects more than one dimension equally

COUNTRIES TO MONITOR: US, CN (China), RU (Russia), IL (Israel), CA (Canada), EU (Europe), IR (Iran), IN (India), GCC (Gulf Cooperation Council: Saudi Arabia, UAE, Qatar, Kuwait, Bahrain, Oman)
MIDDLE EAST COUNTRIES: SA (Saudi Arabia), IR (Iran), SY (Syria), LB (Lebanon), PS (Palestine), YE (Yemen), IQ (Iraq), AE (UAE), JO (Jordan), EG (Egypt)

Return ONLY valid JSON with this exact structure:
{
  "affectedCountries": ["US", "RU"],
  "wrdiDimension": "military",
  "severityScore": 7.5,
  "relevanceScore": 0.85,
  "kbUpdates": [
    {
      "entityType": "country_pair",
      "entityId": "US-RU",
      "fieldName": "dangerousScenario",
      "newValue": "Updated scenario description based on this event",
      "reasoning": "Why this field should be updated"
    }
  ]
}

Rules:
- severityScore: 1-10 (how severe/impactful is this event)
- relevanceScore: 0-1 (how relevant is this to Middle East dynamics)
- Only include kbUpdates if the event is significant enough to warrant updating the knowledge base (severityScore >= 6)
- For kbUpdates, fieldName must be one of: politicalAnticipation, dangerousScenario, treatyViability, middleEastDimension, remainingOptions, geopoliticalPosture, currentPressures
- For country_pair entityId, use format "XX-YY" with alphabetical ordering (CA-US, CN-US, etc.)
- Keep newValue concise (1-3 sentences max)
- If not relevant to our monitored countries, return empty affectedCountries and 0 kbUpdates`;

    const response = await invokeLLM({
      messages: [{ role: "user", content: prompt }],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "event_classification",
          strict: true,
          schema: {
            type: "object",
            properties: {
              affectedCountries: { type: "array", items: { type: "string" } },
              wrdiDimension: { type: "string", enum: ["political", "military", "economic", "social", "multiple"] },
              severityScore: { type: "number" },
              relevanceScore: { type: "number" },
              kbUpdates: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    entityType: { type: "string", enum: ["country_profile", "country_pair", "scenario"] },
                    entityId: { type: "string" },
                    fieldName: { type: "string" },
                    newValue: { type: "string" },
                    reasoning: { type: "string" },
                  },
                  required: ["entityType", "entityId", "fieldName", "newValue", "reasoning"],
                  additionalProperties: false,
                },
              },
            },
            required: ["affectedCountries", "wrdiDimension", "severityScore", "relevanceScore", "kbUpdates"],
            additionalProperties: false,
          },
        },
      },
    } as any);

    const content = response?.choices?.[0]?.message?.content;
    if (!content) return null;
    const contentStr = typeof content === "string" ? content : JSON.stringify(content);
    return JSON.parse(contentStr) as ClassifiedEvent;
  } catch (e) {
    console.warn("[Pipeline] Classification failed:", (e as Error).message);
    return null;
  }
}

// ── WRDI Score Updater ───────────────────────────────────────────────────────
async function recalculateWRDIScores(
  db: DB,
  countryId: string,
  events: Array<{ dimension: string; severityScore: number }>
): Promise<void> {
  // Get current scores
  const [current] = await db
    .select()
    .from(countryProfiles)
    .where(eq(countryProfiles.countryId, countryId))
    .limit(1);

  if (!current) return;

  // Calculate delta from recent events (weighted average shift)
  const dimensionEvents: Record<string, number[]> = {
    political: [], military: [], economic: [], social: [],
  };

  for (const e of events) {
    const dim = e.dimension === "multiple" ? null : e.dimension;
    if (dim && dimensionEvents[dim]) {
      dimensionEvents[dim].push(e.severityScore);
    } else if (e.dimension === "multiple") {
      Object.values(dimensionEvents).forEach(arr => arr.push(e.severityScore * 0.5));
    }
  }

  const calcNewScore = (current: number, eventScores: number[]): number => {
    if (eventScores.length === 0) return current;
    const avgEvent = eventScores.reduce((a, b) => a + b, 0) / eventScores.length;
    // Blend: 70% current + 30% new signal, clamped to 1-10
    const newScore = current * 0.7 + avgEvent * 0.3;
    return Math.max(1, Math.min(10, newScore));
  };

  const newPolitical = calcNewScore(current.wrdiPolitical ?? 5, dimensionEvents.political);
  const newMilitary = calcNewScore(current.wrdiMilitary ?? 5, dimensionEvents.military);
  const newEconomic = calcNewScore(current.wrdiEconomic ?? 5, dimensionEvents.economic);
  const newSocial = calcNewScore(current.wrdiSocial ?? 5, dimensionEvents.social);
  const newComposite = newPolitical * 0.25 + newMilitary * 0.30 + newEconomic * 0.25 + newSocial * 0.20;

  const prevComposite = current.wrdiComposite ?? 5;
  const trend = newComposite > prevComposite + 0.2 ? "rising" :
    newComposite < prevComposite - 0.2 ? "falling" : "stable";

  await db
    .update(countryProfiles)
    .set({
      wrdiPolitical: newPolitical,
      wrdiMilitary: newMilitary,
      wrdiEconomic: newEconomic,
      wrdiSocial: newSocial,
      wrdiComposite: newComposite,
      wrdiTrend: trend,
      lastPipelineUpdate: new Date(),
    })
    .where(eq(countryProfiles.countryId, countryId));
}

// ── Knowledge Base Field Updater ─────────────────────────────────────────────
async function applyKBUpdate(
  db: DB,
  update: KBUpdate,
  pipelineRunId: string,
  triggeringEventIds: number[]
): Promise<void> {
  let previousValue = "";

  if (update.entityType === "country_profile") {
    const [profile] = await db
      .select()
      .from(countryProfiles)
      .where(eq(countryProfiles.countryId, update.entityId))
      .limit(1);
    if (!profile) return;

    const field = update.fieldName as keyof typeof profile;
    previousValue = JSON.stringify(profile[field] ?? "");

    // Only update text fields, not numeric scores
    const updatableFields = ["geopoliticalPosture", "currentPressures"];
    if (!updatableFields.includes(update.fieldName)) return;

    if (update.fieldName === "currentPressures") {
      const current = (profile.currentPressures as string[]) ?? [];
      const updated = [update.newValue, ...current.slice(0, 3)]; // Keep last 3 + new
      await db.update(countryProfiles)
        .set({ currentPressures: updated, lastPipelineUpdate: new Date() })
        .where(eq(countryProfiles.countryId, update.entityId));
    } else if (update.fieldName === "geopoliticalPosture") {
      await db.update(countryProfiles)
        .set({ geopoliticalPosture: update.newValue, lastPipelineUpdate: new Date() })
        .where(eq(countryProfiles.countryId, update.entityId));
    }
  } else if (update.entityType === "country_pair") {
    const [pair] = await db
      .select()
      .from(countryPairs)
      .where(eq(countryPairs.pairId, update.entityId))
      .limit(1);
    if (!pair) return;

    const field = update.fieldName as keyof typeof pair;
    previousValue = JSON.stringify(pair[field] ?? "");

    const updatableFields = [
      "dangerousScenario", "treatyViability", "winnerAssessment",
      "middleEastDimension", "leverageReason",
    ];
    const arrayFields = ["politicalAnticipation", "remainingOptions", "tensionPoints", "cooperationAreas"];

    if (updatableFields.includes(update.fieldName)) {
      await db.update(countryPairs)
        .set({ [update.fieldName]: update.newValue, lastPipelineUpdate: new Date() })
        .where(eq(countryPairs.pairId, update.entityId));
    } else if (arrayFields.includes(update.fieldName)) {
      const current = (pair[field] as string[]) ?? [];
      const updated = [update.newValue, ...current.slice(0, 3)];
      await db.update(countryPairs)
        .set({ [update.fieldName]: updated, lastPipelineUpdate: new Date() })
        .where(eq(countryPairs.pairId, update.entityId));
    }
  } else if (update.entityType === "scenario") {
    const [scenario] = await db
      .select()
      .from(middleEastScenarios)
      .where(eq(middleEastScenarios.scenarioId, update.entityId))
      .limit(1);
    if (!scenario) return;

    const field = update.fieldName as keyof typeof scenario;
    previousValue = JSON.stringify(scenario[field] ?? "");

    const updatableFields = ["trigger", "economicImpact", "politicalImpact"];
    if (updatableFields.includes(update.fieldName)) {
      await db.update(middleEastScenarios)
        .set({ [update.fieldName]: update.newValue, lastPipelineUpdate: new Date() })
        .where(eq(middleEastScenarios.scenarioId, update.entityId));
    }
  }

  // Log the change
  await db.insert(kbChangelog).values({
    entityType: update.entityType,
    entityId: update.entityId,
    fieldChanged: update.fieldName,
    previousValue,
    newValue: update.newValue,
    triggeringEventIds,
    pipelineRunId,
    changedAt: new Date(),
  });
}

// ── Fast Pipeline Runner (RSS + GDELT only — runs every 15 min) ────────────
export async function runFastPipeline(): Promise<{
  success: boolean;
  eventsIngested: number;
  eventsClassified: number;
  kbFieldsUpdated: number;
  runId: string;
  error?: string;
}> {
  const runId = `fast-${nanoid(12)}`;
  const db = await getDb();
  if (!db) {
    return { success: false, eventsIngested: 0, eventsClassified: 0, kbFieldsUpdated: 0, runId, error: "Database not available" };
  }

  await db.insert(pipelineRuns).values({
    runId,
    status: "running",
    sourcesQueried: [],
    eventsIngested: 0,
    eventsClassified: 0,
    kbFieldsUpdated: 0,
    startedAt: new Date(),
  });

  console.log(`[Pipeline:FAST] Run ${runId} started`);

  let eventsIngested = 0;
  let eventsClassified = 0;
  let kbFieldsUpdated = 0;
  const sourcesQueried: string[] = [];

  try {
    // Fetch only fast-tier RSS sources + GDELT
    const fastRssSources = RSS_SOURCES.filter(s => s.tier === "fast");
    const originalSources = RSS_SOURCES.splice(0, RSS_SOURCES.length, ...fastRssSources);
    const [gdeltEvents, rssEvents] = await Promise.allSettled([
      fetchGDELT(),
      fetchRSSFeeds(),
    ]);
    // Restore original sources
    RSS_SOURCES.splice(0, RSS_SOURCES.length, ...originalSources);

    const allRawEvents: RawEvent[] = [];
    const addEvents = (result: PromiseSettledResult<RawEvent[]>, sourceName: string) => {
      if (result.status === "fulfilled" && result.value.length > 0) {
        allRawEvents.push(...result.value);
        sourcesQueried.push(sourceName);
        console.log(`[Pipeline:FAST] ${sourceName}: ${result.value.length} events`);
      }
    };
    addEvents(gdeltEvents, "GDELT");
    addEvents(rssEvents, "RSS");

    eventsIngested = allRawEvents.length;
    console.log(`[Pipeline:FAST] Total events ingested: ${eventsIngested}`);

    // Store raw events
    const storedEventIds: number[] = [];
    for (const event of allRawEvents) {
      try {
        const [result] = await db.insert(pipelineEvents).values({
          source: event.source,
          sourceUrl: event.sourceUrl ?? null,
          eventTitle: event.title,
          eventSummary: event.summary,
          eventDate: event.eventDate,
          affectedCountries: [],
          wrdiDimension: null,
          severityScore: null,
          relevanceScore: null,
          processed: false,
          appliedToKnowledgeBase: false,
          rawData: event.rawData,
          fetchedAt: new Date(),
        } as any);
        storedEventIds.push((result as any).insertId);
      } catch {
        // Skip duplicates
      }
    }

    // Classify events
    console.log(`[Pipeline:FAST] Classifying ${allRawEvents.length} events...`);
    const countryEventMap: Record<string, Array<{ dimension: string; severityScore: number }>> = {};
    COUNTRY_IDS.forEach(id => { countryEventMap[id] = []; });

    const BATCH_SIZE = 5;
    for (let i = 0; i < allRawEvents.length; i += BATCH_SIZE) {
      const batch = allRawEvents.slice(i, i + BATCH_SIZE);
      const classifications = await Promise.allSettled(batch.map(e => classifyEvent(e)));
      for (let j = 0; j < batch.length; j++) {
        const classResult = classifications[j];
        const eventIdx = storedEventIds[i + j];
        if (classResult.status !== "fulfilled" || !classResult.value) continue;
        const classification = classResult.value;
        eventsClassified++;
        if (eventIdx) {
          await db.update(pipelineEvents)
            .set({
              affectedCountries: classification.affectedCountries,
              wrdiDimension: classification.wrdiDimension,
              severityScore: classification.severityScore,
              relevanceScore: classification.relevanceScore,
              processed: true,
            })
            .where(eq(pipelineEvents.id, eventIdx));
        }
        for (const countryId of classification.affectedCountries) {
          if (COUNTRY_IDS.includes(countryId)) {
            countryEventMap[countryId].push({ dimension: classification.wrdiDimension, severityScore: classification.severityScore });
          }
        }
        for (const update of classification.kbUpdates) {
          try {
            await applyKBUpdate(db, update, runId, eventIdx ? [eventIdx] : []);
            kbFieldsUpdated++;
          } catch (e) {
            console.warn(`[Pipeline:FAST] KB update failed:`, (e as Error).message);
          }
        }
      }
    }

    // Recalculate WRDI scores
    console.log(`[Pipeline:FAST] Recalculating WRDI scores...`);
    for (const countryId of COUNTRY_IDS) {
      const events = countryEventMap[countryId];
      if (events.length === 0) continue;
      await recalculateWRDIScores(db as DB, countryId, events);
      console.log(`[Pipeline:FAST] WRDI updated for ${countryId} (${events.length} events)`);
    }

    await db.update(pipelineRuns)
      .set({ status: "completed", sourcesQueried, eventsIngested, eventsClassified, kbFieldsUpdated, completedAt: new Date() })
      .where(eq(pipelineRuns.runId, runId));

    console.log(`[Pipeline:FAST] Run ${runId} completed: ${eventsIngested} ingested, ${eventsClassified} classified, ${kbFieldsUpdated} KB fields updated`);
    return { success: true, eventsIngested, eventsClassified, kbFieldsUpdated, runId };
  } catch (e) {
    const errorMsg = (e as Error).message;
    console.error(`[Pipeline:FAST] Run ${runId} failed:`, errorMsg);
    await db.update(pipelineRuns)
      .set({ status: "failed", errorMessage: errorMsg, completedAt: new Date() })
      .where(eq(pipelineRuns.runId, runId));
    return { success: false, eventsIngested, eventsClassified, kbFieldsUpdated, runId, error: errorMsg };
  }
}

// ── Full Pipeline Runner (all sources — runs every 6 hours) ──────────────────
export async function runPipeline(): Promise<{
  success: boolean;
  eventsIngested: number;
  eventsClassified: number;
  kbFieldsUpdated: number;
  runId: string;
  error?: string;
}> {
  const runId = nanoid(16);
  const db = await getDb();
  if (!db) {
    return { success: false, eventsIngested: 0, eventsClassified: 0, kbFieldsUpdated: 0, runId, error: "Database not available" };
  }

  // Create run record
  await db.insert(pipelineRuns).values({
    runId,
    status: "running",
    sourcesQueried: [],
    eventsIngested: 0,
    eventsClassified: 0,
    kbFieldsUpdated: 0,
    startedAt: new Date(),
  });

  console.log(`[Pipeline] Run ${runId} started`);

  let eventsIngested = 0;
  let eventsClassified = 0;
  let kbFieldsUpdated = 0;
  const sourcesQueried: string[] = [];

  try {
    // ── Step 1: Fetch from all sources ──────────────────────────────────────
    console.log("[Pipeline] Fetching from sources...");
     const [gdeltEvents, acledEvents, wbEvents, imfEvents, unhcrEvents, eiaEvents, rssEvents] = await Promise.allSettled([
      fetchGDELT(),
      fetchACLED(),
      fetchWorldBank(),
      fetchIMF(),
      fetchUNHCR(),
      fetchEIA(),
      fetchRSSFeeds(),
    ]);
    const allRawEvents: RawEvent[] = [];
    const addEvents = (result: PromiseSettledResult<RawEvent[]>, sourceName: string) => {
      if (result.status === "fulfilled" && result.value.length > 0) {
        allRawEvents.push(...result.value);
        sourcesQueried.push(sourceName);
        console.log(`[Pipeline] ${sourceName}: ${result.value.length} events`);
      }
    };
    addEvents(gdeltEvents, "GDELT");
    addEvents(acledEvents, "ACLED");
    addEvents(wbEvents, "WorldBank");
    addEvents(imfEvents, "IMF");
    addEvents(unhcrEvents, "UNHCR");
    addEvents(eiaEvents, "EIA");
    addEvents(rssEvents, "RSS");

    eventsIngested = allRawEvents.length;
    console.log(`[Pipeline] Total events ingested: ${eventsIngested}`);

    // ── Step 2: Store raw events in DB ──────────────────────────────────────
    const storedEventIds: number[] = [];
    for (const event of allRawEvents) {
      try {
        const [result] = await db.insert(pipelineEvents).values({
          source: event.source,
          sourceUrl: event.sourceUrl ?? null,
          eventTitle: event.title,
          eventSummary: event.summary,
          eventDate: event.eventDate,
          affectedCountries: [],
          wrdiDimension: null,
          severityScore: null,
          relevanceScore: null,
          processed: false,
          appliedToKnowledgeBase: false,
          rawData: event.rawData,
          fetchedAt: new Date(),
        } as any);
        storedEventIds.push((result as any).insertId);
      } catch (e) {
        // Skip duplicate events
      }
    }

    // ── Step 3: Classify events with LLM ────────────────────────────────────
    console.log("[Pipeline] Classifying events...");
    const countryEventMap: Record<string, Array<{ dimension: string; severityScore: number }>> = {};
    COUNTRY_IDS.forEach(id => { countryEventMap[id] = []; });

    // Process events in batches of 5 to avoid rate limits
    const BATCH_SIZE = 5;
    for (let i = 0; i < allRawEvents.length; i += BATCH_SIZE) {
      const batch = allRawEvents.slice(i, i + BATCH_SIZE);
      const classifications = await Promise.allSettled(batch.map(e => classifyEvent(e)));

      for (let j = 0; j < batch.length; j++) {
        const classResult = classifications[j];
        const eventIdx = storedEventIds[i + j];
        if (classResult.status !== "fulfilled" || !classResult.value) continue;

        const classification = classResult.value;
        eventsClassified++;

        // Update the stored event with classification
        if (eventIdx) {
          await db.update(pipelineEvents)
            .set({
              affectedCountries: classification.affectedCountries,
              wrdiDimension: classification.wrdiDimension,
              severityScore: classification.severityScore,
              relevanceScore: classification.relevanceScore,
              processed: true,
            })
            .where(eq(pipelineEvents.id, eventIdx));
        }

        // Track for WRDI score updates
        for (const countryId of classification.affectedCountries) {
          if (countryEventMap[countryId]) {
            countryEventMap[countryId].push({
              dimension: classification.wrdiDimension,
              severityScore: classification.severityScore,
            });
          }
        }

        // ── Step 4: Apply KB updates ─────────────────────────────────────────
        if (classification.kbUpdates && classification.kbUpdates.length > 0) {
          for (const update of classification.kbUpdates) {
            try {
              await applyKBUpdate(db, update, runId, eventIdx ? [eventIdx] : []);
              kbFieldsUpdated++;

              // Mark event as applied
              if (eventIdx) {
                await db.update(pipelineEvents)
                  .set({ appliedToKnowledgeBase: true })
                  .where(eq(pipelineEvents.id, eventIdx));
              }
            } catch (e) {
              console.warn("[Pipeline] KB update failed:", (e as Error).message);
            }
          }
        }
      }

      // Small delay between batches
      if (i + BATCH_SIZE < allRawEvents.length) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    // ── Step 5: Recalculate WRDI scores ──────────────────────────────────────
    console.log("[Pipeline] Recalculating WRDI scores...");
    for (const countryId of COUNTRY_IDS) {
      const events = countryEventMap[countryId];
      if (events.length > 0) {
        await recalculateWRDIScores(db as DB, countryId, events);
        console.log(`[Pipeline] WRDI updated for ${countryId} (${events.length} events)`);
      }
    }

    // ── Finalize run ──────────────────────────────────────────────────────────
    await db.update(pipelineRuns)
      .set({
        status: "completed",
        sourcesQueried,
        eventsIngested,
        eventsClassified,
        kbFieldsUpdated,
        completedAt: new Date(),
      })
      .where(eq(pipelineRuns.runId, runId));

    console.log(`[Pipeline] Run ${runId} completed: ${eventsIngested} ingested, ${eventsClassified} classified, ${kbFieldsUpdated} KB fields updated`);

    return { success: true, eventsIngested, eventsClassified, kbFieldsUpdated, runId };

  } catch (error) {
    const errorMessage = (error as Error).message;
    console.error(`[Pipeline] Run ${runId} failed:`, errorMessage);

    await db.update(pipelineRuns)
      .set({ status: "failed", errorMessage, completedAt: new Date() })
      .where(eq(pipelineRuns.runId, runId));

    return { success: false, eventsIngested, eventsClassified, kbFieldsUpdated, runId, error: errorMessage };
  }
}
