/**
 * Knowledge Base Seed Script
 * Migrates all static data from geopoliticalData.ts into the database.
 * Run once: node server/seed-kb.mjs
 */

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// ── Country Profiles ─────────────────────────────────────────────────────────
const COUNTRIES = [
  {
    countryId: "US", name: "United States", flag: "🇺🇸", color: "#3B82F6",
    economicPillars: ["Technology & AI (Apple, Microsoft, Nvidia, Alphabet)", "Defense & Aerospace (Lockheed, Raytheon, Boeing)", "Financial Services (JPMorgan, Goldman Sachs, Visa)", "Energy (ExxonMobil, Chevron, NextEra)", "Healthcare & Pharma (UnitedHealth, J&J, Pfizer)", "Consumer & Retail (Amazon, Walmart, Tesla)"],
    keyIndicators: ["S&P 500", "Fed Funds Rate", "US 10Y Treasury", "USD Index", "WTI Crude", "US CPI"],
    vulnerabilities: ["National debt exceeding $34 trillion with rising interest costs", "Semiconductor supply chain dependence on Taiwan (TSMC)", "Domestic political polarization limiting foreign policy coherence", "Overextended military commitments in multiple theaters", "Dollar weaponization accelerating de-dollarization globally"],
    strategicAssets: ["5th Fleet based in Bahrain", "Al Udeid Air Base in Qatar", "Diego Garcia strategic positioning", "CENTCOM regional command structure"],
    currentPressures: ["Gaza conflict straining relationships with Arab allies", "Iran nuclear program approaching weapons-grade enrichment", "Houthi Red Sea attacks disrupting global shipping", "Domestic pressure to reduce Middle East military footprint"],
    middleEastInterests: ["Ensuring Israeli security and military superiority in the region", "Preventing Iran from acquiring nuclear weapons capability", "Maintaining freedom of navigation through Strait of Hormuz", "Securing Gulf state oil production stability to manage global energy prices", "Advancing Abraham Accords normalization (Saudi-Israel as ultimate prize)", "Countering Russian and Chinese influence expansion in the region"],
    geopoliticalPosture: "The United States maintains a global hegemonic posture built on dollar dominance, military supremacy, and alliance networks (NATO, AUKUS, Quad). Under current political dynamics, there is a shift toward selective engagement and burden-sharing, with increased focus on China as the primary strategic competitor. The US views the Middle East through the lens of Israeli security, energy market stability, and containing Iranian influence.",
  },
  {
    countryId: "CN", name: "China", flag: "🇨🇳", color: "#EF4444",
    economicPillars: ["Manufacturing & Export (world's factory, 28% of global manufacturing)", "Technology (Huawei, CATL, BYD, Alibaba, Tencent)", "Real Estate & Infrastructure (historically 25-30% of GDP)", "Rare Earth & Critical Minerals (60%+ of global processing)", "State-Owned Enterprises (banking, energy, telecoms)", "Belt and Road Infrastructure Investment"],
    keyIndicators: ["Shanghai Composite", "Hang Seng", "CNY/USD", "China PMI", "Property Price Index", "Caixin PMI"],
    vulnerabilities: ["Real estate sector crisis (Evergrande, Country Garden) threatening financial stability", "Demographic decline — aging population with shrinking workforce", "Technology decoupling and semiconductor export controls from US", "Overreliance on export-led growth model facing headwinds", "Energy import dependence — 75% of oil imports via Strait of Malacca (Malacca Dilemma)", "Debt trap exposure from Belt and Road overextension"],
    strategicAssets: ["Djibouti military base (first overseas)", "Gwadar Port (Pakistan) — Indian Ocean access", "Haifa Port stake (Israel) — Mediterranean access", "Extensive BRI port investments across Indian Ocean rim"],
    currentPressures: ["Economic slowdown and property sector crisis reducing investment capacity", "US-led semiconductor restrictions limiting tech advancement", "Taiwan Strait tensions creating military expenditure pressure", "Balancing Iran relationship with Gulf Arab state partnerships"],
    middleEastInterests: ["Securing uninterrupted oil and LNG imports (Saudi Arabia, UAE, Iraq, Iran are top suppliers)", "Protecting BRI investments in ports, infrastructure across the region", "Expanding RMB usage in energy trade (petro-yuan ambitions)", "Diplomatic positioning as neutral mediator (Saudi-Iran deal 2023)", "Countering US military encirclement by building relationships with Gulf states", "Iran as strategic partner and sanctions-busting energy source"],
    geopoliticalPosture: "China pursues a strategy of 'peaceful rise' rhetorically while aggressively expanding its sphere of influence through economic statecraft (BRI), military modernization, and diplomatic coalition-building (SCO, BRICS+). The primary strategic objective is Taiwan reunification and displacing US hegemony in the Asia-Pacific. In the Middle East, China has pivoted from pure economic engagement to active diplomatic mediation.",
  },
  {
    countryId: "RU", name: "Russia", flag: "🇷🇺", color: "#F97316",
    economicPillars: ["Hydrocarbons (oil & gas — 40%+ of federal budget revenue)", "Defense Industry (world's 2nd largest arms exporter pre-war)", "Agriculture (world's largest wheat exporter)", "Nuclear Energy (Rosatom — 20% of global nuclear fuel supply)", "Metals & Mining (nickel, palladium, aluminum, titanium)", "Military-Industrial Complex (war economy pivot)"],
    keyIndicators: ["MOEX Russia Index", "RUB/USD", "Urals Crude Price", "Russia CPI", "CBR Key Rate"],
    vulnerabilities: ["Western sanctions cutting off technology imports and financial markets", "Demographic crisis — declining population, brain drain accelerating", "Economic overreliance on hydrocarbon exports (Dutch disease)", "Military attrition in Ukraine depleting equipment and manpower reserves", "Isolation from Western financial system (SWIFT exclusion)", "Dependence on China as economic lifeline creating asymmetric relationship"],
    strategicAssets: ["Tartus Naval Base (Syria) — only Mediterranean military presence", "Khmeimim Air Base (Syria) — power projection into MENA", "TurkStream pipeline — energy leverage over Turkey", "S-400 sales creating NATO alliance complications"],
    currentPressures: ["Ukraine war consuming military resources and economic capacity", "Oil price sensitivity — needs $70-80/bbl to balance budget", "Growing dependence on China creating leverage imbalance", "Iran relationship complicating Gulf Arab state partnerships"],
    middleEastInterests: ["Maintaining Syria presence as only Mediterranean naval base (Tartus)", "Arms sales to Egypt, Algeria, UAE, and historically Iraq and Libya", "Coordinating oil production with OPEC+ (Saudi Arabia) to manage prices", "Iran as strategic partner for drone technology and sanctions circumvention", "Preventing NATO/US military expansion into Black Sea and Eastern Mediterranean", "Using energy leverage over Turkey (TurkStream) for geopolitical influence"],
    geopoliticalPosture: "Russia under Putin pursues a revisionist strategy aimed at restoring great power status and a sphere of influence over post-Soviet space. The Ukraine war has accelerated Russia's pivot to Asia and the Global South, deepening partnerships with China, Iran, and North Korea. In the Middle East, Russia leverages its Syria presence, arms sales, and energy relationships to maintain relevance.",
  },
  {
    countryId: "IL", name: "Israel", flag: "🇮🇱", color: "#3B82F6",
    economicPillars: ["Technology & Cybersecurity (Silicon Wadi — Intel, Microsoft R&D, Check Point)", "Defense Technology (Rafael, Elbit, IAI — top 10 global arms exporters per capita)", "Pharmaceuticals & Biotech (Teva, generic drug dominance)", "Agriculture Technology (drip irrigation, precision agriculture)", "Diamond Trade (Ramat Gan — major global hub)", "Natural Gas (Leviathan & Tamar fields — regional energy exporter)"],
    keyIndicators: ["TA-35 Index", "ILS/USD", "Israel CPI", "Defense Spending %GDP", "Natural Gas Production"],
    vulnerabilities: ["Geographic isolation surrounded by hostile states and non-state actors", "Dependence on US military aid and diplomatic protection ($3.8B/year)", "Small domestic market limiting economic scale without exports", "Ongoing multi-front security threats (Hamas, Hezbollah, Iran)", "Judicial reform crisis creating domestic political instability", "Gaza war costs straining fiscal position and international reputation"],
    strategicAssets: ["Nuclear deterrent (estimated 80-400 warheads, undeclared)", "Iron Dome, David's Sling, Arrow missile defense systems", "F-35I Adir fleet — regional air superiority", "Unit 8200 — world-class signals intelligence capability"],
    currentPressures: ["Gaza war creating international isolation and ICC proceedings", "Hezbollah northern front requiring sustained military posture", "Iran nuclear program approaching red lines", "Domestic political crisis over judicial reform"],
    middleEastInterests: ["Preventing Iranian nuclear weapons acquisition — existential priority", "Completing Abraham Accords normalization, especially with Saudi Arabia", "Degrading Hamas, Hezbollah, and Iranian proxy network capabilities", "Securing natural gas export routes to Europe via Cyprus and Greece", "Maintaining US military and diplomatic support as strategic guarantor", "Expanding economic ties with Gulf states (UAE, Bahrain) post-Accords"],
    geopoliticalPosture: "Israel operates as a regional military superpower with nuclear ambiguity, maintaining qualitative military edge (QME) through US partnership and indigenous defense innovation. The primary strategic objective is preventing Iran from acquiring nuclear weapons — by any means necessary. The Abraham Accords (2020) represented a strategic breakthrough.",
  },
  {
    countryId: "CA", name: "Canada", flag: "🇨🇦", color: "#EF4444",
    economicPillars: ["Energy (oil sands, natural gas — world's 4th largest oil producer)", "Financial Services (Royal Bank, TD, Scotiabank)", "Real Estate & Construction (historically overheated market)", "Mining & Metals (gold, uranium, potash, nickel)", "Technology (Shopify, Constellation Software, BlackBerry)", "Agriculture (wheat, canola — major global exporter)"],
    keyIndicators: ["TSX Composite", "CAD/USD", "WCS Oil Price", "Canada CPI", "BoC Rate", "Housing Price Index"],
    vulnerabilities: ["Extreme economic dependence on US (75%+ of exports go to US)", "Housing affordability crisis threatening social stability", "Underfunded military (1.3% GDP defense spending, below NATO 2% target)", "Pipeline infrastructure constraints limiting oil export diversification", "Immigration-driven population growth straining housing and services", "Vulnerability to US tariff threats under CUSMA/USMCA"],
    strategicAssets: ["NORAD partnership with US — continental air defense", "Five Eyes intelligence sharing network", "Arctic sovereignty claims and Northern passage access", "Uranium and critical mineral reserves"],
    currentPressures: ["US tariff threats under Trump administration creating economic anxiety", "Domestic debate over Gaza war response straining multicultural coalition", "Defense spending pressure from NATO allies", "Housing and cost-of-living crisis dominating domestic politics"],
    middleEastInterests: ["Maintaining alliance cohesion with US and NATO partners on Iran policy", "Protecting Canadian citizens and diaspora communities in the region", "Trade relationships with Gulf states (arms sales, agricultural exports)", "Participating in coalition counter-terrorism operations", "Oil price stability affecting Canadian energy sector competitiveness"],
    geopoliticalPosture: "Canada operates as a middle power within the US-led Western alliance, leveraging its G7 membership, NATO participation, and Five Eyes intelligence sharing. Canada's foreign policy is largely derivative of US positions, with occasional divergences on multilateralism and human rights.",
  },
  {
    countryId: "EU", name: "Europe (EU+UK)", flag: "🇪🇺", color: "#3B82F6",
    economicPillars: ["Advanced Manufacturing (Germany — automotive, machinery, chemicals)", "Financial Services (London — global financial center)", "Luxury & Consumer Brands (France — LVMH, L'Oréal, Airbus)", "Energy Transition (renewables, nuclear — France)", "Pharmaceuticals (AstraZeneca, Novartis, Roche, Bayer)", "Defense Industry (BAE Systems, Airbus Defence, Leonardo, Thales)"],
    keyIndicators: ["DAX", "CAC 40", "FTSE 100", "EUR/USD", "ECB Rate", "Eurozone CPI", "European Gas TTF"],
    vulnerabilities: ["Energy dependence — post-Russia pivot still adjusting to higher LNG costs", "Defense capability gap — decades of underinvestment requiring rapid rearmament", "Demographic decline and immigration tensions threatening social cohesion", "German industrial competitiveness crisis (energy costs, China competition)", "Fragmented foreign policy — 27 member states with divergent interests", "Exposure to China trade slowdown (Germany especially)"],
    strategicAssets: ["EUFOR and NATO military capabilities", "Diplomatic soft power and development aid", "ASML monopoly on EUV lithography machines", "Euro as world's second reserve currency"],
    currentPressures: ["Ukraine war demanding sustained military and financial support", "Gaza war creating domestic political tensions and Muslim community pressure", "Energy price volatility affecting industrial competitiveness", "US tariff threats under Trump administration"],
    middleEastInterests: ["Energy security — Gulf LNG as replacement for Russian gas", "Migration management — Middle East instability drives refugee flows to Europe", "Counter-terrorism cooperation with regional partners", "Trade relationships with Gulf states (arms sales, infrastructure)", "Israeli-Palestinian conflict resolution as long-term stability goal", "Iran nuclear containment through diplomatic engagement (JCPOA)"],
    geopoliticalPosture: "Europe is undergoing a strategic awakening driven by the Russia-Ukraine war, with defense spending rising across the continent. The EU is asserting greater strategic autonomy while remaining anchored in the transatlantic alliance. In the Middle East, Europe has significant economic interests (energy, trade) and humanitarian concerns (migration flows), but limited military capacity for independent action.",
  },
];

// ── WRDI Metric Definitions ──────────────────────────────────────────────────
const METRIC_DEFINITIONS = [
  { metricKey: "wrdi_composite", label: "WRDI Composite Score", dimension: "composite", weight: 1.0,
    definition: "The World Risk & Dynamics Index (WRDI) composite score aggregates four weighted dimensions into a single risk indicator. Formula: (Political × 0.25) + (Military × 0.30) + (Economic × 0.25) + (Social × 0.20). A higher score indicates greater instability and unpredictability in a country's behavior and environment.",
    dataSource: "GDELT, ACLED, World Bank, IMF, Yahoo Finance",
    scaleDescription: "1–2: Very Low risk, stable and predictable | 3–4: Low risk, minor tensions | 5–6: Medium risk, active pressures | 7–8: High risk, significant instability | 9–10: Critical, acute crisis conditions" },
  { metricKey: "wrdi_political", label: "Political / Diplomatic Dimension", dimension: "political", weight: 0.25,
    definition: "Measures the stability and assertiveness of a country's political and diplomatic posture. Includes: UN Security Council activity, bilateral diplomatic incidents, summit frequency, alliance cohesion, leadership stability, and foreign policy coherence. Source priority: Reuters, AP, BBC, UN official records.",
    dataSource: "Reuters, AP, BBC, UN, CFR, Brookings",
    scaleDescription: "1–2: Stable governance, active diplomacy | 3–4: Minor political tensions | 5–6: Contested elections or diplomatic friction | 7–8: Political crisis or significant diplomatic breakdown | 9–10: Regime instability or complete diplomatic rupture" },
  { metricKey: "wrdi_military", label: "Military / Security Dimension", dimension: "military", weight: 0.30,
    definition: "The highest-weighted dimension (30%). Tracks active military operations, arms transfers, troop movements, security incidents, and readiness posture. Elevated by: active conflict, cross-border operations, arms deals, military exercises near contested zones, and nuclear posturing. Source priority: ACLED, SIPRI, IISS, Reuters.",
    dataSource: "ACLED, SIPRI, IISS, Reuters, Global Terrorism Index",
    scaleDescription: "1–2: No active operations, peacetime posture | 3–4: Low-level incidents or elevated readiness | 5–6: Active operations or significant arms transfers | 7–8: Ongoing conflict or major military escalation | 9–10: Full-scale war or nuclear threat posturing" },
  { metricKey: "wrdi_economic", label: "Economic Dimension", dimension: "economic", weight: 0.25,
    definition: "Reflects the economic health and vulnerability of a country as a driver of political behavior. Incorporates: equity market performance, currency stability, inflation, sanctions exposure, trade balance, and commodity price sensitivity. Countries under economic stress are more likely to take aggressive or unpredictable political actions.",
    dataSource: "Yahoo Finance, World Bank, IMF, OECD, EIA, OANDA",
    scaleDescription: "1–2: Strong growth, stable currency, low inflation | 3–4: Moderate slowdown or currency pressure | 5–6: Recession risk or significant sanctions exposure | 7–8: Economic crisis, severe currency depreciation | 9–10: Economic collapse or hyperinflationary conditions" },
  { metricKey: "wrdi_social", label: "Social Dimension", dimension: "social", weight: 0.20,
    definition: "Captures the social stability and humanitarian conditions within a country. Includes: refugee and displacement flows, protest activity, human rights violations, food security, public health crises, and demographic pressures. Social instability often precedes or amplifies political and military escalation.",
    dataSource: "UNHCR, IOM, WFP, Amnesty International, Human Rights Watch, WHO",
    scaleDescription: "1–2: Stable society, low displacement | 3–4: Minor social tensions or localized displacement | 5–6: Significant protest activity or refugee flows | 7–8: Humanitarian crisis or widespread civil unrest | 9–10: Mass atrocities, famine, or societal collapse" },
  { metricKey: "tension_score", label: "Bilateral Tension Score", dimension: "political", weight: null,
    definition: "A 0–100 index measuring the level of active friction between two countries. Derived from: diplomatic incidents, sanctions, military posturing, trade disputes, and proxy conflicts. A score above 70 indicates the relationship is in an active adversarial phase. Above 85 indicates near-crisis conditions.",
    dataSource: "ACLED, Reuters, UN Security Council records, SIPRI",
    scaleDescription: "0–30: Cooperative relationship | 31–50: Competitive but managed | 51–70: Active tensions with escalation risk | 71–85: Adversarial, limited cooperation | 86–100: Near-crisis or active conflict" },
  { metricKey: "cooperation_score", label: "Bilateral Cooperation Score", dimension: "political", weight: null,
    definition: "A 0–100 index measuring active areas of collaboration between two countries. Includes: trade volume, joint military exercises, diplomatic exchanges, multilateral coordination, and shared institutional membership. High cooperation does not preclude high tension — many relationships are simultaneously competitive and cooperative.",
    dataSource: "World Bank trade data, UN, NATO, bilateral treaty databases",
    scaleDescription: "0–20: Minimal or no cooperation | 21–40: Limited transactional cooperation | 41–60: Moderate cooperation in specific domains | 61–80: Broad cooperation across multiple domains | 81–100: Deep alliance-level integration" },
  { metricKey: "me_impact_score", label: "Middle East Impact Score", dimension: "composite", weight: null,
    definition: "Measures how significantly this bilateral relationship shapes outcomes in the Middle East. Considers: energy market influence, military presence, proxy relationships, diplomatic leverage over regional actors, and trade flows through the region. This is the core metric for assessing which external power dynamics most directly affect Middle East stability.",
    dataSource: "OPEC, IEA, CENTCOM, UN, bilateral trade data",
    scaleDescription: "0–30: Peripheral influence on Middle East | 31–50: Moderate regional relevance | 51–70: Significant impact on regional dynamics | 71–85: Major driver of regional outcomes | 86–100: Central to Middle East stability or instability" },
];

// ── Run seed ─────────────────────────────────────────────────────────────────
console.log("🌱 Seeding knowledge base...");

// Seed country profiles
for (const c of COUNTRIES) {
  await connection.execute(
    `INSERT INTO country_profiles 
      (countryId, name, flag, color, economicPillars, keyIndicators, vulnerabilities, 
       strategicAssets, currentPressures, middleEastInterests, geopoliticalPosture,
       wrdiPolitical, wrdiMilitary, wrdiEconomic, wrdiSocial, wrdiComposite)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 5.0, 5.0, 5.0, 5.0, 5.0)
     ON DUPLICATE KEY UPDATE
       name=VALUES(name), geopoliticalPosture=VALUES(geopoliticalPosture),
       economicPillars=VALUES(economicPillars), keyIndicators=VALUES(keyIndicators),
       vulnerabilities=VALUES(vulnerabilities), strategicAssets=VALUES(strategicAssets),
       currentPressures=VALUES(currentPressures), middleEastInterests=VALUES(middleEastInterests)`,
    [
      c.countryId, c.name, c.flag, c.color,
      JSON.stringify(c.economicPillars), JSON.stringify(c.keyIndicators),
      JSON.stringify(c.vulnerabilities), JSON.stringify(c.strategicAssets),
      JSON.stringify(c.currentPressures), JSON.stringify(c.middleEastInterests),
      c.geopoliticalPosture,
    ]
  );
  console.log(`  ✓ Country: ${c.name}`);
}

// Seed WRDI metric definitions
for (const m of METRIC_DEFINITIONS) {
  await connection.execute(
    `INSERT INTO wrdi_metric_definitions 
      (metricKey, label, dimension, weight, definition, dataSource, scaleDescription)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       label=VALUES(label), definition=VALUES(definition),
       dataSource=VALUES(dataSource), scaleDescription=VALUES(scaleDescription)`,
    [m.metricKey, m.label, m.dimension, m.weight ?? null, m.definition, m.dataSource, m.scaleDescription]
  );
  console.log(`  ✓ Metric: ${m.label}`);
}

console.log("\n✅ Knowledge base seed complete.");
await connection.end();
