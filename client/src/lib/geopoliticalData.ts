// ============================================================
// GEOPOLITICAL INTELLIGENCE ENGINE — Knowledge Base
// Compiled from deep research on 6 major economies and their
// bilateral relationships, with Middle East as focal lens.
// ============================================================

export interface CountryProfile {
  id: string;
  name: string;
  flag: string;
  color: string;
  economicPillars: string[];
  keyStocks: { symbol: string; name: string; sector: string }[];
  keyIndicators: string[];
  vulnerabilities: string[];
  geopoliticalPosture: string;
  middleEastInterests: string[];
  currentPressures: string[];
  strategicAssets: string[];
}

export interface CountryPairAnalysis {
  id: string;
  country1: string;
  country2: string;
  relationshipType: "Allied" | "Competitive" | "Hostile" | "Transactional" | "Mixed";
  tensionScore: number; // 0-100
  cooperationScore: number; // 0-100
  middleEastImpactScore: number; // 0-100
  economicInterdependency: string;
  tensionPoints: string[];
  cooperationAreas: string[];
  middleEastDimension: string;
  politicalAnticipation: string[];
  treatyViability: string;
  winnerAssessment: string;
  leverageHolder: string;
  leverageReason: string;
  dangerousScenario: string;
  remainingOptions: string[];
}

export interface MiddleEastScenario {
  id: string;
  title: string;
  riskLevel: "Critical" | "High" | "Medium" | "Low";
  probability: "High" | "Medium" | "Low";
  trigger: string;
  economicImpact: string;
  politicalImpact: string;
  marketSignals: string[];
  affectedCountries: string[];
  timeframe: string;
}

export interface LiveDataConfig {
  symbol: string;
  name: string;
  country: string;
  type: "index" | "stock" | "commodity" | "currency" | "bond";
}

// ============================================================
// COUNTRY PROFILES
// ============================================================

export const COUNTRIES: CountryProfile[] = [
  {
    id: "US",
    name: "United States",
    flag: "🇺🇸",
    color: "#3B82F6",
    economicPillars: [
      "Technology & AI (Apple, Microsoft, Nvidia, Alphabet)",
      "Defense & Aerospace (Lockheed, Raytheon, Boeing)",
      "Financial Services (JPMorgan, Goldman Sachs, Visa)",
      "Energy (ExxonMobil, Chevron, NextEra)",
      "Healthcare & Pharma (UnitedHealth, J&J, Pfizer)",
      "Consumer & Retail (Amazon, Walmart, Tesla)",
    ],
    keyStocks: [
      { symbol: "AAPL", name: "Apple", sector: "Technology" },
      { symbol: "MSFT", name: "Microsoft", sector: "Technology" },
      { symbol: "NVDA", name: "Nvidia", sector: "AI/Semiconductors" },
      { symbol: "LMT", name: "Lockheed Martin", sector: "Defense" },
      { symbol: "XOM", name: "ExxonMobil", sector: "Energy" },
      { symbol: "JPM", name: "JPMorgan Chase", sector: "Finance" },
    ],
    keyIndicators: ["S&P 500", "Fed Funds Rate", "US 10Y Treasury", "USD Index", "WTI Crude", "US CPI"],
    vulnerabilities: [
      "National debt exceeding $34 trillion with rising interest costs",
      "Semiconductor supply chain dependence on Taiwan (TSMC)",
      "Domestic political polarization limiting foreign policy coherence",
      "Overextended military commitments in multiple theaters",
      "Dollar weaponization accelerating de-dollarization globally",
    ],
    geopoliticalPosture: "The United States maintains a global hegemonic posture built on dollar dominance, military supremacy, and alliance networks (NATO, AUKUS, Quad). Under current political dynamics, there is a shift toward selective engagement and burden-sharing, with increased focus on China as the primary strategic competitor. The US views the Middle East through the lens of Israeli security, energy market stability, and containing Iranian influence. Domestically, the political economy increasingly favors protectionism and industrial policy (CHIPS Act, IRA), signaling a departure from pure free-market globalism.",
    middleEastInterests: [
      "Ensuring Israeli security and military superiority in the region",
      "Preventing Iran from acquiring nuclear weapons capability",
      "Maintaining freedom of navigation through Strait of Hormuz",
      "Securing Gulf state oil production stability to manage global energy prices",
      "Advancing Abraham Accords normalization (Saudi-Israel as ultimate prize)",
      "Countering Russian and Chinese influence expansion in the region",
    ],
    currentPressures: [
      "Gaza conflict straining relationships with Arab allies",
      "Iran nuclear program approaching weapons-grade enrichment",
      "Houthi Red Sea attacks disrupting global shipping",
      "Domestic pressure to reduce Middle East military footprint",
    ],
    strategicAssets: [
      "5th Fleet based in Bahrain",
      "Al Udeid Air Base in Qatar",
      "Diego Garcia strategic positioning",
      "CENTCOM regional command structure",
    ],
  },
  {
    id: "CN",
    name: "China",
    flag: "🇨🇳",
    color: "#EF4444",
    economicPillars: [
      "Manufacturing & Export (world's factory, 28% of global manufacturing)",
      "Technology (Huawei, CATL, BYD, Alibaba, Tencent)",
      "Real Estate & Infrastructure (historically 25-30% of GDP)",
      "Rare Earth & Critical Minerals (60%+ of global processing)",
      "State-Owned Enterprises (banking, energy, telecoms)",
      "Belt and Road Infrastructure Investment",
    ],
    keyStocks: [
      { symbol: "BABA", name: "Alibaba", sector: "E-Commerce/Tech" },
      { symbol: "BYDDY", name: "BYD", sector: "EV/Batteries" },
      { symbol: "600519.SS", name: "Kweichow Moutai", sector: "Consumer" },
      { symbol: "601398.SS", name: "ICBC", sector: "Banking" },
      { symbol: "000858.SZ", name: "Wuliangye", sector: "Consumer" },
    ],
    keyIndicators: ["Shanghai Composite", "Hang Seng", "CNY/USD", "China PMI", "Property Price Index", "Caixin PMI"],
    vulnerabilities: [
      "Real estate sector crisis (Evergrande, Country Garden) threatening financial stability",
      "Demographic decline — aging population with shrinking workforce",
      "Technology decoupling and semiconductor export controls from US",
      "Overreliance on export-led growth model facing headwinds",
      "Energy import dependence — 75% of oil imports via Strait of Malacca (Malacca Dilemma)",
      "Debt trap exposure from Belt and Road overextension",
    ],
    geopoliticalPosture: "China pursues a strategy of 'peaceful rise' rhetorically while aggressively expanding its sphere of influence through economic statecraft (BRI), military modernization, and diplomatic coalition-building (SCO, BRICS+). The primary strategic objective is Taiwan reunification and displacing US hegemony in the Asia-Pacific. In the Middle East, China has pivoted from pure economic engagement to active diplomatic mediation (Saudi-Iran normalization 2023), positioning itself as a neutral alternative to US influence. China's energy security imperative — importing 75% of its oil from the Middle East — makes regional stability a core national interest.",
    middleEastInterests: [
      "Securing uninterrupted oil and LNG imports (Saudi Arabia, UAE, Iraq, Iran are top suppliers)",
      "Protecting BRI investments in ports, infrastructure across the region",
      "Expanding RMB usage in energy trade (petro-yuan ambitions)",
      "Diplomatic positioning as neutral mediator (Saudi-Iran deal 2023)",
      "Countering US military encirclement by building relationships with Gulf states",
      "Iran as strategic partner and sanctions-busting energy source",
    ],
    currentPressures: [
      "Economic slowdown and property sector crisis reducing investment capacity",
      "US-led semiconductor restrictions limiting tech advancement",
      "Taiwan Strait tensions creating military expenditure pressure",
      "Balancing Iran relationship with Gulf Arab state partnerships",
    ],
    strategicAssets: [
      "Djibouti military base (first overseas)",
      "Gwadar Port (Pakistan) — Indian Ocean access",
      "Haifa Port stake (Israel) — Mediterranean access",
      "Extensive BRI port investments across Indian Ocean rim",
    ],
  },
  {
    id: "RU",
    name: "Russia",
    flag: "🇷🇺",
    color: "#F97316",
    economicPillars: [
      "Hydrocarbons (oil & gas — 40%+ of federal budget revenue)",
      "Defense Industry (world's 2nd largest arms exporter pre-war)",
      "Agriculture (world's largest wheat exporter)",
      "Nuclear Energy (Rosatom — 20% of global nuclear fuel supply)",
      "Metals & Mining (nickel, palladium, aluminum, titanium)",
      "Military-Industrial Complex (war economy pivot)",
    ],
    keyStocks: [
      { symbol: "GAZP.ME", name: "Gazprom", sector: "Natural Gas" },
      { symbol: "LKOH.ME", name: "Lukoil", sector: "Oil" },
      { symbol: "SBER.ME", name: "Sberbank", sector: "Banking" },
      { symbol: "ROSN.ME", name: "Rosneft", sector: "Oil" },
      { symbol: "NVTK.ME", name: "Novatek", sector: "LNG" },
    ],
    keyIndicators: ["MOEX Russia Index", "RUB/USD", "Urals Crude Price", "Russia CPI", "CBR Key Rate"],
    vulnerabilities: [
      "Western sanctions cutting off technology imports and financial markets",
      "Demographic crisis — declining population, brain drain accelerating",
      "Economic overreliance on hydrocarbon exports (Dutch disease)",
      "Military attrition in Ukraine depleting equipment and manpower reserves",
      "Isolation from Western financial system (SWIFT exclusion)",
      "Dependence on China as economic lifeline creating asymmetric relationship",
    ],
    geopoliticalPosture: "Russia under Putin pursues a revisionist strategy aimed at restoring great power status and a sphere of influence over post-Soviet space. The Ukraine war has accelerated Russia's pivot to Asia and the Global South, deepening partnerships with China, Iran, and North Korea. In the Middle East, Russia leverages its Syria presence, arms sales, and energy relationships to maintain relevance. Russia's primary strategic value to Middle Eastern states is as a counterbalance to US influence and a source of military equipment without political conditions. The war economy has made Russia increasingly dependent on Iran for drones and China for dual-use goods.",
    middleEastInterests: [
      "Maintaining Syria presence as only Mediterranean naval base (Tartus)",
      "Arms sales to Egypt, Algeria, UAE, and historically Iraq and Libya",
      "Coordinating oil production with OPEC+ (Saudi Arabia) to manage prices",
      "Iran as strategic partner for drone technology and sanctions circumvention",
      "Preventing NATO/US military expansion into Black Sea and Eastern Mediterranean",
      "Using energy leverage over Turkey (TurkStream) for geopolitical influence",
    ],
    currentPressures: [
      "Ukraine war consuming military resources and economic capacity",
      "Oil price sensitivity — needs $70-80/bbl to balance budget",
      "Growing dependence on China creating leverage imbalance",
      "Iran relationship complicating Gulf Arab state partnerships",
    ],
    strategicAssets: [
      "Tartus Naval Base (Syria) — only Mediterranean military presence",
      "Khmeimim Air Base (Syria) — power projection into MENA",
      "TurkStream pipeline — energy leverage over Turkey",
      "S-400 sales creating NATO alliance complications",
    ],
  },
  {
    id: "IL",
    name: "Israel",
    flag: "🇮🇱",
    color: "#3B82F6",
    economicPillars: [
      "Technology & Cybersecurity (Silicon Wadi — Intel, Microsoft R&D, Check Point)",
      "Defense Technology (Rafael, Elbit, IAI — top 10 global arms exporters per capita)",
      "Pharmaceuticals & Biotech (Teva, generic drug dominance)",
      "Agriculture Technology (drip irrigation, precision agriculture)",
      "Diamond Trade (Ramat Gan — major global hub)",
      "Natural Gas (Leviathan & Tamar fields — regional energy exporter)",
    ],
    keyStocks: [
      { symbol: "ESLT", name: "Elbit Systems", sector: "Defense Tech" },
      { symbol: "TEVA", name: "Teva Pharmaceutical", sector: "Pharma" },
      { symbol: "CHKP", name: "Check Point Software", sector: "Cybersecurity" },
      { symbol: "ICL", name: "ICL Group", sector: "Chemicals/Minerals" },
      { symbol: "NICE", name: "NICE Systems", sector: "AI/Analytics" },
    ],
    keyIndicators: ["TA-35 Index", "ILS/USD", "Israel CPI", "Defense Spending %GDP", "Natural Gas Production"],
    vulnerabilities: [
      "Geographic isolation surrounded by hostile states and non-state actors",
      "Dependence on US military aid and diplomatic protection ($3.8B/year)",
      "Small domestic market limiting economic scale without exports",
      "Ongoing multi-front security threats (Hamas, Hezbollah, Iran)",
      "Judicial reform crisis creating domestic political instability",
      "Gaza war costs straining fiscal position and international reputation",
    ],
    geopoliticalPosture: "Israel operates as a regional military superpower with nuclear ambiguity, maintaining qualitative military edge (QME) through US partnership and indigenous defense innovation. The primary strategic objective is preventing Iran from acquiring nuclear weapons — by any means necessary. The Abraham Accords (2020) represented a strategic breakthrough, normalizing relations with UAE, Bahrain, Morocco, and Sudan. Saudi normalization remains the ultimate diplomatic prize. The Gaza war has complicated this trajectory while simultaneously demonstrating Israeli military capability and exposing vulnerabilities to asymmetric warfare.",
    middleEastInterests: [
      "Preventing Iranian nuclear weapons acquisition — existential priority",
      "Completing Abraham Accords normalization, especially with Saudi Arabia",
      "Degrading Hamas, Hezbollah, and Iranian proxy network capabilities",
      "Securing natural gas export routes to Europe via Cyprus and Greece",
      "Maintaining US military and diplomatic support as strategic guarantor",
      "Expanding economic ties with Gulf states (UAE, Bahrain) post-Accords",
    ],
    currentPressures: [
      "Gaza war creating international isolation and ICC proceedings",
      "Hezbollah northern front requiring sustained military posture",
      "Iran nuclear program approaching red lines",
      "Domestic political crisis over judicial reform and war cabinet divisions",
    ],
    strategicAssets: [
      "Nuclear deterrent (estimated 80-400 warheads, undeclared)",
      "Iron Dome, David's Sling, Arrow missile defense systems",
      "F-35I Adir fleet — regional air superiority",
      "Unit 8200 — world-class signals intelligence capability",
    ],
  },
  {
    id: "CA",
    name: "Canada",
    flag: "🇨🇦",
    color: "#EF4444",
    economicPillars: [
      "Energy (oil sands, natural gas — world's 4th largest oil producer)",
      "Financial Services (Royal Bank, TD, Scotiabank)",
      "Real Estate & Construction (historically overheated market)",
      "Mining & Metals (gold, uranium, potash, nickel)",
      "Technology (Shopify, Constellation Software, BlackBerry)",
      "Agriculture (wheat, canola — major global exporter)",
    ],
    keyStocks: [
      { symbol: "RY.TO", name: "Royal Bank of Canada", sector: "Banking" },
      { symbol: "CNQ.TO", name: "Canadian Natural Resources", sector: "Oil & Gas" },
      { symbol: "SHOP.TO", name: "Shopify", sector: "Technology" },
      { symbol: "SU.TO", name: "Suncor Energy", sector: "Oil Sands" },
      { symbol: "ABX.TO", name: "Barrick Gold", sector: "Mining" },
    ],
    keyIndicators: ["TSX Composite", "CAD/USD", "WCS Oil Price", "Canada CPI", "BoC Rate", "Housing Price Index"],
    vulnerabilities: [
      "Extreme economic dependence on US (75%+ of exports go to US)",
      "Housing affordability crisis threatening social stability",
      "Underfunded military (1.3% GDP defense spending, below NATO 2% target)",
      "Pipeline infrastructure constraints limiting oil export diversification",
      "Immigration-driven population growth straining housing and services",
      "Vulnerability to US tariff threats under CUSMA/USMCA",
    ],
    geopoliticalPosture: "Canada operates as a middle power within the US-led Western alliance, leveraging its G7 membership, NATO participation, and Five Eyes intelligence sharing. Canada's foreign policy is largely derivative of US positions, with occasional divergences on multilateralism and human rights. The Canada-US relationship is the defining constraint on Canadian foreign policy — any significant divergence from US positions carries severe economic risk. Canada has limited direct Middle East interests but participates in coalition operations and maintains diplomatic relationships with Gulf states for energy and trade purposes.",
    middleEastInterests: [
      "Maintaining alliance cohesion with US and NATO partners on Iran policy",
      "Protecting Canadian citizens and diaspora communities in the region",
      "Trade relationships with Gulf states (arms sales, agricultural exports)",
      "Participating in coalition counter-terrorism operations",
      "Oil price stability affecting Canadian energy sector competitiveness",
    ],
    currentPressures: [
      "US tariff threats under Trump administration creating economic anxiety",
      "Domestic debate over Gaza war response straining multicultural coalition",
      "Defense spending pressure from NATO allies",
      "Housing and cost-of-living crisis dominating domestic politics",
    ],
    strategicAssets: [
      "NORAD partnership with US — continental air defense",
      "Five Eyes intelligence sharing network",
      "Arctic sovereignty claims and Northern passage access",
      "Uranium and critical mineral reserves",
    ],
  },
  {
    id: "EU",
    name: "Europe (EU+UK)",
    flag: "🇪🇺",
    color: "#3B82F6",
    economicPillars: [
      "Advanced Manufacturing (Germany — automotive, machinery, chemicals)",
      "Financial Services (London — global financial center)",
      "Luxury & Consumer Brands (France — LVMH, L'Oréal, Airbus)",
      "Energy Transition (renewables, nuclear — France)",
      "Pharmaceuticals (AstraZeneca, Novartis, Roche, Bayer)",
      "Defense Industry (BAE Systems, Airbus Defence, Leonardo, Thales)",
    ],
    keyStocks: [
      { symbol: "ASML", name: "ASML Holding", sector: "Semiconductors" },
      { symbol: "SAP", name: "SAP SE", sector: "Enterprise Software" },
      { symbol: "LVMH", name: "LVMH", sector: "Luxury" },
      { symbol: "BA.L", name: "BAE Systems", sector: "Defense" },
      { symbol: "AIR.PA", name: "Airbus", sector: "Aerospace" },
    ],
    keyIndicators: ["DAX", "CAC 40", "FTSE 100", "EUR/USD", "ECB Rate", "Eurozone CPI", "European Gas TTF"],
    vulnerabilities: [
      "Energy dependence — post-Russia pivot still adjusting to higher LNG costs",
      "Defense capability gap — decades of underinvestment requiring rapid rearmament",
      "Demographic decline and immigration tensions threatening social cohesion",
      "German industrial competitiveness crisis (energy costs, China competition)",
      "Fragmented foreign policy — 27 member states with divergent interests",
      "Exposure to China trade slowdown (Germany especially)",
    ],
    geopoliticalPosture: "Europe is undergoing a strategic awakening driven by the Russia-Ukraine war, with defense spending rising across the continent. The EU is asserting greater strategic autonomy while remaining anchored in the transatlantic alliance. In the Middle East, Europe has significant economic interests (energy, trade) and humanitarian concerns (migration flows), but limited military capacity for independent action. European states are divided on Israel-Gaza, with some (Germany) strongly pro-Israel and others (Ireland, Spain) more critical. The energy transition imperative makes Gulf state LNG and hydrogen partnerships increasingly important.",
    middleEastInterests: [
      "Energy security — Gulf LNG as replacement for Russian gas",
      "Migration management — Middle East instability drives refugee flows to Europe",
      "Counter-terrorism cooperation with regional partners",
      "Trade relationships with Gulf states (arms sales, infrastructure)",
      "Israeli-Palestinian conflict resolution as long-term stability goal",
      "Iran nuclear containment through diplomatic engagement (JCPOA)",
    ],
    currentPressures: [
      "Ukraine war demanding sustained military and financial support",
      "Gaza war creating domestic political tensions and Muslim community pressure",
      "Energy price volatility affecting industrial competitiveness",
      "US tariff threats under Trump administration",
    ],
    strategicAssets: [
      "EUFOR and NATO military capabilities",
      "Diplomatic soft power and development aid",
      "ASML monopoly on EUV lithography machines",
      "Euro as world's second reserve currency",
    ],
  },
];

// ============================================================
// COUNTRY-PAIR RELATIONSHIP MATRIX
// ============================================================

export const COUNTRY_PAIRS: CountryPairAnalysis[] = [
  {
    id: "US-CN",
    country1: "US",
    country2: "CN",
    relationshipType: "Mixed",
    tensionScore: 72,
    cooperationScore: 35,
    middleEastImpactScore: 75,
    economicInterdependency: "~$575B bilateral trade (2023), declining. US imports Chinese goods; China holds ~$800B US Treasuries. Decoupling accelerating in tech, semiconductors, EVs.",
    tensionPoints: [
      "Taiwan — China views reunification as non-negotiable; US committed to Taiwan's self-defense",
      "Semiconductor export controls — US restricting advanced chip access to China",
      "South China Sea territorial disputes and freedom of navigation",
      "Fentanyl precursor chemicals flowing from China to US drug market",
      "TikTok/tech platform national security concerns",
      "Trade deficit and alleged intellectual property theft",
    ],
    cooperationAreas: [
      "Climate change — both are world's largest emitters",
      "Global financial stability — mutual interest in avoiding dollar collapse",
      "North Korea nuclear containment",
      "Pandemic preparedness (limited)",
    ],
    middleEastDimension: "The US-China rivalry plays out acutely in the Middle East. China's 2023 brokering of Saudi-Iran normalization was a direct challenge to US regional dominance. Gulf states are increasingly hedging — maintaining US security guarantees while deepening economic ties with China. China's energy dependence on the Gulf (75% of oil imports) means it has strong interest in regional stability, but its approach differs fundamentally from the US: China offers economic engagement without political conditions, while the US ties relationships to security frameworks and values. The competition for Saudi Arabia's alignment is the central battleground — Saudi Vision 2030 needs Chinese investment and US security simultaneously.",
    politicalAnticipation: [
      "US will escalate semiconductor and AI export controls, forcing China to accelerate domestic chip development",
      "China will deepen Gulf state economic relationships to reduce US leverage in the region",
      "Taiwan Strait tensions will increase as China tests US resolve under new administration",
      "Both sides will compete for Saudi Arabia's alignment on oil production and currency decisions",
      "China will use BRI investments to build alternative financial infrastructure bypassing dollar",
    ],
    treatyViability: "No formal bilateral treaty. Phase 1 trade deal (2020) largely unfulfilled. Both sides maintain diplomatic channels but structural competition is deepening. The relationship is best described as 'competitive coexistence' with high risk of accidental escalation.",
    winnerAssessment: "Short-term: US retains advantage through dollar dominance, military superiority, and alliance networks. Medium-term: China's economic scale and manufacturing capacity create structural challenges. Long-term: Outcome depends on Taiwan scenario and whether China can break through semiconductor restrictions.",
    leverageHolder: "US",
    leverageReason: "Dollar dominance, semiconductor supply chain control (ASML, TSMC), and alliance network give US structural advantages. China's Malacca Dilemma (energy import vulnerability) is a persistent strategic weakness.",
    dangerousScenario: "Taiwan military conflict — China blockade or invasion triggering US military response. This would cause global supply chain collapse, semiconductor shortage, and potential nuclear escalation. Oil prices would spike to $150+, devastating Middle East-dependent economies. Israel would face pressure to choose sides.",
    remainingOptions: [
      "US: Strengthen Taiwan defense capabilities, accelerate semiconductor reshoring, build Indo-Pacific alliance",
      "US: Engage China on climate and financial stability to prevent complete decoupling",
      "China: Accelerate domestic semiconductor development (SMIC), deepen BRICS+ financial alternatives",
      "China: Use economic statecraft in Middle East to reduce US influence without direct confrontation",
    ],
  },
  {
    id: "US-RU",
    country1: "US",
    country2: "RU",
    relationshipType: "Hostile",
    tensionScore: 88,
    cooperationScore: 12,
    middleEastImpactScore: 82,
    economicInterdependency: "Minimal — bilateral trade near zero post-sanctions. Russia excluded from SWIFT, dollar system. US has frozen ~$300B in Russian sovereign assets.",
    tensionPoints: [
      "Ukraine war — US providing $100B+ in military aid to Ukraine",
      "NATO expansion — Russia views as existential threat",
      "Nuclear posturing — Russia has made implicit nuclear threats",
      "Frozen Russian assets — Russia threatens retaliation",
      "Russian interference in US elections and disinformation campaigns",
      "Arctic territorial and resource competition",
    ],
    cooperationAreas: [
      "Space station operations (ISS — though winding down)",
      "Nuclear arms control (New START expired, no replacement)",
      "Occasional back-channel communication to prevent accidental escalation",
    ],
    middleEastDimension: "Russia and the US are in direct competition across the Middle East. Russia's Syria presence (Tartus naval base, Khmeimim air base) gives it a permanent military foothold. Russia sells arms to Egypt, Algeria, and historically to Iraq and Libya. Russia coordinates with Iran on Syria and uses Iranian drones in Ukraine. The US-Russia rivalry in the Middle East is asymmetric: Russia uses military presence and arms sales for influence, while the US uses security guarantees and financial integration. Key battleground: Turkey — a NATO member that bought Russian S-400 systems and maintains relations with both sides. Russia's oil price coordination with OPEC+ (Saudi Arabia) gives it economic leverage that intersects with US interests.",
    politicalAnticipation: [
      "Russia will seek a frozen conflict in Ukraine to preserve territorial gains and end economic bleeding",
      "Russia will deepen Iran partnership, potentially providing advanced air defense in exchange for drones/missiles",
      "Russia will use Syria presence to project influence into Libya and Sahel",
      "US will maintain Ukraine support but may reduce intensity under new administration",
      "Russia will attempt to fracture NATO unity through energy pressure and disinformation",
    ],
    treatyViability: "All major bilateral treaties effectively suspended or expired. New START nuclear arms control treaty expired February 2023 with no replacement. The relationship is at its lowest point since the Cold War with no normalization pathway visible.",
    winnerAssessment: "Ukraine war outcome is the key variable. If Russia achieves territorial consolidation, it signals that military revisionism works, emboldening China on Taiwan. If Ukraine recovers territory, Russia faces internal stability questions. Currently, Russia is winning the war of attrition while losing the economic war.",
    leverageHolder: "US",
    leverageReason: "Dollar system control, NATO alliance, technology access, and ability to sustain Ukraine indefinitely. However, Russia has nuclear deterrence and energy leverage over Europe, and China as economic lifeline.",
    dangerousScenario: "Russian tactical nuclear use in Ukraine — either in response to major territorial losses or as escalation signal. This would trigger unprecedented NATO response, potentially Article 5 invocation, and global economic shock. Middle East oil producers would face impossible choices between US and Russian alignment.",
    remainingOptions: [
      "US: Continue Ukraine support while pursuing back-channel ceasefire negotiations",
      "US: Seize frozen Russian assets to fund Ukraine reconstruction",
      "Russia: Negotiate ceasefire from current territorial position, seek sanctions relief",
      "Russia: Escalate to force negotiations by threatening wider conflict",
    ],
  },
  {
    id: "US-IL",
    country1: "US",
    country2: "IL",
    relationshipType: "Allied",
    tensionScore: 28,
    cooperationScore: 88,
    middleEastImpactScore: 95,
    economicInterdependency: "US provides $3.8B/year in military aid. Bilateral trade ~$50B. US tech companies have major R&D centers in Israel. Free Trade Agreement since 1985.",
    tensionPoints: [
      "Gaza war — US pressure on civilian casualty reduction vs. Israeli military objectives",
      "West Bank settlements — US opposes expansion, Israel continues",
      "Two-state solution — growing divergence on viability",
      "ICC proceedings against Israeli leaders — US opposes but cannot fully shield",
      "Judicial reform crisis — US concerned about democratic backsliding",
    ],
    cooperationAreas: [
      "Iran containment — shared existential concern",
      "Intelligence sharing — deep integration",
      "Military technology co-development (Iron Dome, F-35)",
      "Cybersecurity cooperation (Unit 8200 alumni ecosystem)",
      "Abraham Accords facilitation",
    ],
    middleEastDimension: "The US-Israel relationship is the central axis of Middle East geopolitics. US security guarantees are Israel's ultimate strategic insurance. In return, Israel provides intelligence, military technology, and serves as a forward operating platform. The Gaza war has strained this relationship publicly while deepening it operationally. The key question is whether the US can simultaneously maintain Israeli security support and advance Saudi normalization — Saudi Arabia has made Palestinian state progress a condition. The Iran nuclear question is where US-Israel alignment is most complete and most consequential: both view Iranian nuclear capability as a red line, but differ on timing and method of response.",
    politicalAnticipation: [
      "US will provide continued military support to Israel while applying increasing pressure on Gaza civilian protection",
      "Israel will pursue Iran nuclear facilities strike if enrichment crosses weapons-grade threshold",
      "US will attempt to revive Saudi-Israel normalization with Palestinian state concessions",
      "Israel will expand Abraham Accords to additional Gulf states",
      "US may condition future military aid on West Bank settlement freeze",
    ],
    treatyViability: "No formal mutual defense treaty, but relationship functions as one in practice. US commitment to Israeli security is bipartisan and deeply institutionalized. The relationship will survive Gaza war strains.",
    winnerAssessment: "Israel holds significant leverage through its intelligence capabilities, technological innovation, and the Iran threat narrative that aligns US interests. However, US leverage through military aid and diplomatic protection is ultimately greater.",
    leverageHolder: "US",
    leverageReason: "Military aid dependency, UN Security Council veto protection, and diplomatic isolation prevention. Without US support, Israel faces existential vulnerability.",
    dangerousScenario: "Israeli strike on Iranian nuclear facilities triggering Iranian retaliation across multiple fronts (Hezbollah, Houthi, Iraqi militias) and potential Iranian Strait of Hormuz closure. Oil prices spike to $150+. US forced into direct military confrontation with Iran. Regional war involving Saudi Arabia, UAE, and potentially Turkey.",
    remainingOptions: [
      "US: Broker Gaza ceasefire to create space for Saudi normalization",
      "US: Provide Israel with bunker-busting munitions for Iran strike in exchange for restraint on timing",
      "Israel: Pursue covert operations against Iran nuclear program (Stuxnet-style)",
      "Israel: Accelerate normalization with Saudi Arabia to build regional coalition against Iran",
    ],
  },
  {
    id: "CN-RU",
    country1: "CN",
    country2: "RU",
    relationshipType: "Transactional",
    tensionScore: 22,
    cooperationScore: 68,
    middleEastImpactScore: 68,
    economicInterdependency: "Bilateral trade reached $240B in 2023 (record). China buys discounted Russian oil/gas; Russia buys Chinese consumer goods and dual-use technology. Russia increasingly dependent on China as Western markets closed.",
    tensionPoints: [
      "China uncomfortable with Russia's nuclear threats — undermines global stability China needs for trade",
      "Historical territorial disputes (Siberia — Russia fears Chinese demographic pressure)",
      "Russia's junior partner status in relationship — pride issue for Putin",
      "China's neutrality on Ukraine limits Russia's diplomatic gains",
      "Competition for influence in Central Asia (SCO dynamics)",
    ],
    cooperationAreas: [
      "Energy trade — Power of Siberia pipelines, LNG purchases",
      "SCO and BRICS+ coordination against Western institutions",
      "Military technology exchange (China provides dual-use goods)",
      "De-dollarization — conducting trade in RMB and rubles",
      "UN Security Council coordination on blocking Western resolutions",
    ],
    middleEastDimension: "China-Russia coordination in the Middle East is primarily tactical rather than strategic. Both oppose US dominance but have different interests: China wants stability for energy imports; Russia wants military presence and arms sales. They coordinate at the UN to block Western resolutions on Syria, Iran, and Libya. Russia's Iran relationship (drone supply) complicates China's Gulf state partnerships. China brokered the Saudi-Iran deal partly to reduce Russia's influence as Iran's primary patron. The relationship is best understood as 'no limits partnership' with actual limits — China will not sacrifice its Gulf state energy relationships for Russia.",
    politicalAnticipation: [
      "China will continue buying Russian energy at discount while avoiding secondary sanctions",
      "Russia will become increasingly dependent on China, accepting junior partner status",
      "China will use Russia relationship to pressure US in negotiations",
      "Both will coordinate BRICS+ expansion to build alternative to Western institutions",
      "China will not provide lethal weapons to Russia — too costly for Western relationships",
    ],
    treatyViability: "No formal alliance treaty. 'No limits' partnership declaration (February 2022) has proven to have limits. Relationship is transactional and asymmetric — China benefits more than Russia.",
    winnerAssessment: "China is the clear winner in this relationship. It buys discounted energy, gains a compliant partner in UN, and positions itself as the senior partner in an alternative world order. Russia has no alternative to China given Western sanctions.",
    leverageHolder: "China",
    leverageReason: "Russia has no alternative economic partner of comparable scale. China can threaten to reduce purchases or comply with Western secondary sanctions, which would be economically devastating for Russia.",
    dangerousScenario: "Russia's internal collapse or regime change leading to nuclear weapons security crisis. China would face impossible choice between intervening to secure nuclear arsenal and respecting sovereignty. Middle East oil markets would be severely disrupted.",
    remainingOptions: [
      "China: Maintain current transactional relationship, avoid secondary sanctions, extract maximum economic benefit",
      "China: Broker Ukraine ceasefire to end economic disruption and restore European trade",
      "Russia: Deepen energy integration with China (Power of Siberia 2) to reduce European dependency",
      "Russia: Use China relationship as leverage in negotiations with West",
    ],
  },
  {
    id: "CN-EU",
    country1: "CN",
    country2: "EU",
    relationshipType: "Competitive",
    tensionScore: 58,
    cooperationScore: 42,
    middleEastImpactScore: 55,
    economicInterdependency: "EU-China trade ~$850B (2023). China is EU's largest import source; EU is China's largest trading partner. Germany especially dependent on China market (Volkswagen, BMW, BASF).",
    tensionPoints: [
      "EV tariffs — EU imposed 35-45% tariffs on Chinese EVs (2024)",
      "Market access asymmetry — China restricts EU investment while EU remains open",
      "Technology transfer and IP theft concerns",
      "Human rights — Xinjiang, Hong Kong, Tibet",
      "Russia support — EU pressure on China to stop dual-use goods to Russia",
      "5G infrastructure — Huawei exclusion from European networks",
    ],
    cooperationAreas: [
      "Climate change — both committed to Paris Agreement",
      "Trade — mutual economic interest in maintaining flows",
      "Global governance — both support multilateral institutions",
      "Iran nuclear deal (JCPOA) — both prefer diplomatic solution",
    ],
    middleEastDimension: "EU and China have overlapping interests in Middle East stability (energy, trade routes) but different approaches. EU prioritizes human rights, democratic governance, and rule of law; China prioritizes non-interference and economic engagement. Both compete for Gulf state infrastructure investment. China's BRI competes with EU's Global Gateway initiative. On Iran, both prefer JCPOA restoration but China has deeper economic ties with Iran. The EU's dependence on Gulf LNG (replacing Russian gas) gives Gulf states leverage over European policy.",
    politicalAnticipation: [
      "EU will escalate trade defense measures against Chinese EVs and solar panels",
      "Germany will resist full decoupling due to auto industry China exposure",
      "EU will attempt 'de-risking' rather than full decoupling from China",
      "China will use market access threats to prevent EU from fully aligning with US on Taiwan",
      "EU will deepen Gulf state LNG partnerships, reducing China's energy leverage",
    ],
    treatyViability: "Comprehensive Agreement on Investment (CAI) suspended since 2021 over Xinjiang sanctions. Relationship in managed competition phase. Full decoupling unlikely given German industrial interests.",
    winnerAssessment: "China holds short-term trade leverage through market access for German auto industry. EU holds long-term leverage through technology (ASML EUV machines essential for advanced chips) and market size.",
    leverageHolder: "Mixed",
    leverageReason: "Mutual dependence with different vulnerabilities. China needs European technology and market; EU needs Chinese manufacturing and market for key industries.",
    dangerousScenario: "Taiwan conflict forcing EU to choose between US alliance obligations and China economic relationship. German auto industry collapse from China market loss would trigger EU-wide recession.",
    remainingOptions: [
      "EU: Accelerate strategic autonomy in critical technologies, reduce China dependencies",
      "EU: Use ASML export controls as leverage in trade negotiations",
      "China: Offer market access concessions to prevent EU-US alignment on Taiwan",
      "China: Deepen BRI investments in EU candidate countries (Western Balkans) to create leverage",
    ],
  },
  {
    id: "RU-EU",
    country1: "RU",
    country2: "EU",
    relationshipType: "Hostile",
    tensionScore: 92,
    cooperationScore: 8,
    middleEastImpactScore: 60,
    economicInterdependency: "Minimal post-sanctions. EU has cut 90%+ of Russian energy imports. Bilateral trade collapsed. ~$300B Russian assets frozen in EU. TurkStream still operational.",
    tensionPoints: [
      "Ukraine war — EU providing €100B+ in military and financial aid to Ukraine",
      "Energy weaponization — Russia cut gas supplies to Europe",
      "Frozen assets — EU considering using interest for Ukraine",
      "Hybrid warfare — Russian sabotage, disinformation, election interference",
      "Baltic states security — direct NATO border with Russia",
      "Nuclear threats — Russia's implicit threats targeting European cities",
    ],
    cooperationAreas: [
      "Grain deal facilitation (Turkey-mediated, expired)",
      "Occasional prisoner exchanges",
      "Back-channel communication through neutral parties",
    ],
    middleEastDimension: "Russia-EU hostility has major Middle East implications. EU's energy pivot from Russian gas to Gulf LNG has made Gulf states more important to Europe and given them leverage. Russia uses its Syria presence and relationships with Libya, Algeria, and Egypt to project influence into Europe's southern neighborhood. Russian disinformation campaigns exploit EU divisions on Gaza and migration. Russia benefits from EU-Middle East tensions (migration crises) that destabilize European politics. The EU's energy dependence on Gulf states means Middle East instability directly threatens European economic stability.",
    politicalAnticipation: [
      "EU will maintain Ukraine support but face increasing political pressure from far-right parties",
      "Russia will attempt to fracture EU unity through energy pressure on Hungary and Slovakia",
      "EU will accelerate defense spending and military integration",
      "Russia will use frozen asset seizure as justification for retaliatory measures",
      "Ceasefire negotiations will eventually occur — terms will determine post-war European security architecture",
    ],
    treatyViability: "All bilateral agreements effectively suspended. Nord Stream pipelines destroyed. Partnership and Cooperation Agreement irrelevant. No normalization pathway without Ukraine resolution.",
    winnerAssessment: "EU is winning the economic war (Russia's economy severely constrained) but Russia is winning the military attrition war in Ukraine. Long-term, Russia faces demographic and economic decline; EU faces political fragmentation.",
    leverageHolder: "EU",
    leverageReason: "Frozen assets, technology export controls, and ability to sustain Ukraine indefinitely. Russia's economy is under severe strain despite resilience.",
    dangerousScenario: "Russian attack on a NATO member state (Estonia, Latvia, Lithuania, or Poland) triggering Article 5 collective defense. Full-scale NATO-Russia war with nuclear escalation risk. Middle East oil producers would face catastrophic demand destruction from global recession.",
    remainingOptions: [
      "EU: Seize frozen Russian assets to fund Ukraine reconstruction",
      "EU: Negotiate ceasefire framework with US and Ukraine",
      "Russia: Seek ceasefire from current territorial position",
      "Russia: Escalate hybrid attacks on EU infrastructure to force negotiations",
    ],
  },
  {
    id: "US-EU",
    country1: "US",
    country2: "EU",
    relationshipType: "Allied",
    tensionScore: 38,
    cooperationScore: 75,
    middleEastImpactScore: 70,
    economicInterdependency: "Largest bilateral trade relationship globally (~$1.3T). Deep financial integration. US companies dominate European tech; European companies major US investors.",
    tensionPoints: [
      "US tariffs — Trump administration threatening 25% tariffs on EU goods",
      "Defense burden-sharing — US pressure for EU to reach 2% GDP defense spending",
      "Digital services taxes — EU taxing US tech companies",
      "Inflation Reduction Act — EU concerned about US green subsidies distorting competition",
      "Divergence on Israel-Gaza — US more pro-Israel than most EU states",
      "China policy — US pushing harder decoupling than EU willing to accept",
    ],
    cooperationAreas: [
      "NATO collective defense",
      "Ukraine support",
      "China containment (partial)",
      "Iran nuclear containment",
      "Counter-terrorism",
      "Financial sanctions coordination",
    ],
    middleEastDimension: "US-EU coordination on the Middle East is significant but imperfect. Both support Israeli security but differ on Palestinian rights. Both want Iran nuclear containment but EU prefers diplomacy (JCPOA) while US under Trump prefers maximum pressure. Both compete with China for Gulf state relationships. EU's energy dependence on Gulf LNG aligns its interests with US on Gulf stability. The key divergence is on Israel-Gaza: EU public opinion is more critical of Israel, creating political pressure that limits EU governments' ability to align fully with US positions.",
    politicalAnticipation: [
      "US will impose tariffs on EU goods, forcing EU to retaliate or negotiate",
      "EU will accelerate strategic autonomy in defense and technology",
      "Both will coordinate on Ukraine support despite US administration changes",
      "EU will diverge from US on Israel-Gaza, supporting ICC proceedings",
      "Transatlantic relationship will survive Trump tariffs but emerge more transactional",
    ],
    treatyViability: "NATO remains the cornerstone. Transatlantic Trade and Investment Partnership (TTIP) negotiations stalled. Relationship under strain but fundamentally intact due to shared values and security interests.",
    winnerAssessment: "Both benefit from the alliance, but US holds structural advantage through dollar dominance, military supremacy, and tech platform control. EU's strategic autonomy ambitions are constrained by security dependence on US.",
    leverageHolder: "US",
    leverageReason: "Military security guarantee (NATO Article 5), dollar system, and tech platform dominance. EU cannot replace US security guarantee in the near term.",
    dangerousScenario: "US withdrawal from NATO commitments under isolationist administration, leaving Baltic states exposed to Russian pressure. EU forced to rapidly militarize, potentially triggering Russian preemptive action.",
    remainingOptions: [
      "EU: Accelerate European defense integration (PESCO, European Defence Fund)",
      "EU: Negotiate bilateral trade deal with US to avoid tariffs",
      "US: Use tariff threats as leverage for EU defense spending increases",
      "US: Maintain NATO commitment while reducing financial burden on US",
    ],
  },
  {
    id: "IL-RU",
    country1: "IL",
    country2: "RU",
    relationshipType: "Mixed",
    tensionScore: 52,
    cooperationScore: 45,
    middleEastImpactScore: 88,
    economicInterdependency: "Limited direct trade. ~1M Russian-speaking Israelis create cultural ties. Israel historically avoided sanctioning Russia. Russian oligarch assets in Israel.",
    tensionPoints: [
      "Russia-Iran military cooperation — Iran drones used in Ukraine, Russia providing air defense to Iran",
      "Syria deconfliction — Israel conducts airstrikes in Syria, requires Russian coordination",
      "Russia's UN positions blocking Israel-favorable resolutions",
      "Russian Jewish emigration — Israel benefits but Russia views as brain drain",
      "Ukraine war — Israel initially neutral, now providing some non-lethal aid to Ukraine",
    ],
    cooperationAreas: [
      "Syria deconfliction hotline — prevents Israeli-Russian military incidents",
      "Russian-Israeli diaspora connections",
      "Historical Holocaust recognition — Russia and Israel share WWII memory",
      "Gas cooperation — Russia historically supplied gas to Israel",
    ],
    middleEastDimension: "The Israel-Russia relationship is one of the most complex in the Middle East. Russia's Syria presence is both a constraint and an enabler for Israel: Israel must coordinate with Russia before striking Iranian targets in Syria, giving Russia leverage. Russia's deepening Iran partnership (drone supply, potential S-400 transfer) is Israel's primary concern in this relationship. Russia has historically maintained back-channel communication with Israel while supporting Iran and Hezbollah's Syrian presence. The relationship deteriorated significantly after Russia's Iran drone cooperation became clear. Israel now faces the prospect of Russian-supplied air defenses protecting Iranian nuclear facilities.",
    politicalAnticipation: [
      "Israel will increasingly align with Ukraine/West as Russia-Iran military cooperation deepens",
      "Russia will use Iran relationship as leverage against Israeli strikes in Syria",
      "Israel will seek to maintain Syria deconfliction channel while opposing Russia-Iran axis",
      "Russia may supply advanced air defense to Iran, complicating Israeli strike options",
      "Israel will use Russian-Israeli diaspora as back-channel for diplomatic communication",
    ],
    treatyViability: "No formal alliance. Deconfliction arrangement in Syria is the key operational relationship. This will be maintained by both sides as long as neither wants direct military confrontation.",
    winnerAssessment: "Russia holds leverage through Syria deconfliction and Iran relationship. Israel holds leverage through US alliance and ability to strike Iranian assets in Syria that Russia cannot fully protect.",
    leverageHolder: "Russia",
    leverageReason: "Russia controls airspace over Syria where Israel conducts strikes against Iranian targets. Russia can withdraw deconfliction cooperation, making Israeli operations far more dangerous.",
    dangerousScenario: "Russia transfers advanced air defense systems (S-400 or S-500) to Iran, enabling Iran to protect nuclear facilities from Israeli airstrikes. Israel forced to conduct more complex, higher-risk strike operations or accept Iranian nuclear capability.",
    remainingOptions: [
      "Israel: Offer Russia economic incentives (technology, investment) to limit Iran military cooperation",
      "Israel: Accelerate strikes on Iranian targets in Syria before Russian air defenses improve",
      "Russia: Use Iran relationship as leverage to extract Israeli neutrality on Ukraine",
      "Russia: Maintain deconfliction while deepening Iran ties — maximize leverage from both",
    ],
  },
  {
    id: "CN-IL",
    country1: "CN",
    country2: "IL",
    relationshipType: "Transactional",
    tensionScore: 42,
    cooperationScore: 48,
    middleEastImpactScore: 72,
    economicInterdependency: "Bilateral trade ~$18B. China invested in Israeli tech startups and infrastructure (Haifa port). Israel exports agricultural tech, cybersecurity, medical devices to China.",
    tensionPoints: [
      "US pressure on Israel to limit Chinese investment in sensitive infrastructure",
      "Haifa port Chinese operation — US Navy concerns about intelligence gathering",
      "Chinese technology transfer to Iran — Israel's existential adversary",
      "Israel's alignment with US in tech decoupling",
      "Chinese UN positions supporting Palestinian statehood over Israeli positions",
    ],
    cooperationAreas: [
      "Agricultural technology — Israel's drip irrigation and precision farming",
      "Medical technology and pharmaceuticals",
      "Infrastructure investment — ports, water treatment",
      "Academic and research cooperation",
    ],
    middleEastDimension: "China-Israel relations are constrained by the US alliance but significant in economic terms. China's investment in Haifa port created a major US-Israel friction point. China views Israel as a technology access point but is constrained by its Iran and Palestinian relationships. Israel views China as an economic opportunity but cannot allow Chinese investment in security-sensitive areas. The key dynamic: China wants Israeli technology; Israel wants Chinese market access; both are constrained by their primary alliances (US for Israel, Iran/Arab states for China). China's 2023 Saudi-Iran deal was partly aimed at reducing Israeli influence in the Gulf.",
    politicalAnticipation: [
      "Israel will restrict Chinese investment in critical infrastructure under US pressure",
      "China will maintain economic relationship while supporting Palestinian positions at UN",
      "Israel will seek to maintain technology exports to China while limiting security-sensitive transfers",
      "China will use Israeli technology access as leverage against full US-Israel alignment on Taiwan",
      "China-Iran military cooperation will increasingly strain China-Israel economic ties",
    ],
    treatyViability: "No formal alliance or treaty. Purely transactional relationship constrained by both countries' primary alliances.",
    winnerAssessment: "China benefits more from Israeli technology access than Israel benefits from Chinese investment. US pressure limits the relationship's development.",
    leverageHolder: "Israel",
    leverageReason: "Israel controls access to unique technologies (cybersecurity, agritech, military tech) that China values. China cannot easily replace Israeli technology partnerships.",
    dangerousScenario: "China-Iran military cooperation reaches level where China provides weapons used against Israel. Israel retaliates against Iranian assets, drawing in Chinese-equipped forces. US forced to choose between supporting Israel and avoiding China confrontation.",
    remainingOptions: [
      "Israel: Maintain technology exports while restricting infrastructure investment",
      "Israel: Use China relationship as hedge against over-dependence on US",
      "China: Offer economic incentives to prevent Israel from fully joining US anti-China coalition",
      "China: Use Palestinian issue as leverage to limit Israeli alignment with US on Taiwan",
    ],
  },
  {
    id: "CA-EU",
    country1: "CA",
    country2: "EU",
    relationshipType: "Allied",
    tensionScore: 18,
    cooperationScore: 72,
    middleEastImpactScore: 40,
    economicInterdependency: "CETA (Comprehensive Economic and Trade Agreement) since 2017. Bilateral trade ~$120B. Canada exports energy, minerals, agriculture; EU exports manufactured goods.",
    tensionPoints: [
      "Defense spending — Canada at 1.3% GDP, below NATO 2% target",
      "Digital services tax — Canada taxing US/EU tech companies",
      "Agricultural trade disputes (dairy, poultry)",
      "Carbon border adjustment mechanism — affects Canadian exports",
    ],
    cooperationAreas: [
      "NATO collective defense",
      "Ukraine support",
      "G7 coordination",
      "Climate change (both committed to Paris Agreement)",
      "CETA trade framework",
    ],
    middleEastDimension: "Canada-EU coordination on the Middle East is largely derivative of their shared US-led Western alliance membership. Both support Israeli security with some reservations on Gaza. Both participate in counter-terrorism coalitions. Canada's Middle East engagement is limited compared to EU's direct energy and migration interests. The relationship's Middle East dimension is primarily about coordinating positions within NATO and G7 frameworks.",
    politicalAnticipation: [
      "Canada will increase defense spending under NATO pressure",
      "Both will coordinate on Ukraine support and Russia sanctions",
      "Canada will seek EU as alternative trade partner if US tariffs escalate",
      "Both will align on Iran nuclear containment through diplomatic means",
    ],
    treatyViability: "CETA provides strong trade foundation. NATO membership aligns security interests. Relationship is stable and cooperative.",
    winnerAssessment: "Roughly balanced relationship with mutual benefits. EU is larger economy with more global influence; Canada benefits from EU market access and diplomatic weight.",
    leverageHolder: "EU",
    leverageReason: "EU's larger economic scale, diplomatic weight, and market size give it more leverage in the relationship.",
    dangerousScenario: "US-Canada trade war forcing Canada to choose between US economic integration and EU alignment. Canada's extreme US dependence limits its ability to pivot to EU.",
    remainingOptions: [
      "Canada: Deepen CETA implementation to reduce US economic dependence",
      "Canada: Increase defense spending to meet NATO commitments",
      "EU: Offer Canada expanded market access as alternative to US market",
      "Both: Coordinate on critical mineral supply chains to reduce China dependence",
    ],
  },
];

// ============================================================
// MIDDLE EAST RISK SCENARIOS
// ============================================================

export const MIDDLE_EAST_SCENARIOS: MiddleEastScenario[] = [
  {
    id: "iran-nuclear",
    title: "Iran Nuclear Breakout",
    riskLevel: "Critical",
    probability: "Medium",
    trigger: "Iran enriches uranium to 90% weapons-grade and announces nuclear capability, or Israel/US intelligence confirms imminent weaponization",
    economicImpact: "Oil spike to $150-200/bbl. Strait of Hormuz closure risk. Global recession trigger. Defense stocks surge. Safe haven flows to gold, USD, CHF.",
    politicalImpact: "Israeli preemptive strike. Iranian retaliation across multiple fronts. Saudi Arabia accelerates own nuclear program. Turkey reconsiders NATO alignment. Regional war involving US forces.",
    marketSignals: ["Oil >$100/bbl sustained", "ILS/USD weakness", "Israeli defense stocks surge", "Gold >$3500", "VIX >40"],
    affectedCountries: ["US", "IL", "RU", "CN", "EU"],
    timeframe: "12-24 months",
  },
  {
    id: "strait-hormuz",
    title: "Strait of Hormuz Closure",
    riskLevel: "Critical",
    probability: "Low",
    trigger: "Iranian military action closing the Strait following US/Israeli strike on Iranian nuclear facilities or escalation of Houthi conflict",
    economicImpact: "20% of global oil supply disrupted. Oil to $200+. Global stagflation. European and Asian economies severely impacted. LNG prices triple.",
    politicalImpact: "US Navy forced into direct confrontation with Iran. Gulf states request US military protection. China faces energy crisis, forced to choose sides. Russia benefits from oil price spike.",
    marketSignals: ["Brent crude >$120", "LNG prices triple", "Shipping insurance rates spike", "EUR/USD drops", "Gold >$3000"],
    affectedCountries: ["US", "CN", "EU", "IL", "RU"],
    timeframe: "6-18 months",
  },
  {
    id: "saudi-israel-normalization",
    title: "Saudi-Israel Normalization Deal",
    riskLevel: "Medium",
    probability: "Medium",
    trigger: "US brokers comprehensive deal: Saudi recognition of Israel in exchange for Palestinian state pathway and US security guarantees/nuclear technology",
    economicImpact: "Regional investment surge. Israeli tech sector boom. Saudi-Israeli trade opens. Gulf tourism and business travel expands. Oil price stability from Saudi-US alignment.",
    politicalImpact: "Iran isolated diplomatically. Hamas and Hezbollah lose Arab state support. Palestinian Authority strengthened or bypassed. China's regional influence reduced. Russia loses Arab state leverage.",
    marketSignals: ["TA-35 surge >10%", "Saudi Aramco rally", "Defense stocks mixed", "Oil price stability", "USD strength"],
    affectedCountries: ["US", "IL", "CN", "RU"],
    timeframe: "12-36 months",
  },
  {
    id: "houthi-escalation",
    title: "Houthi Red Sea Escalation",
    riskLevel: "High",
    probability: "High",
    trigger: "Houthi attacks expand to include Gulf state oil infrastructure or direct attacks on US naval vessels, triggering major US military response",
    economicImpact: "Shipping costs remain elevated. Suez Canal traffic disruption. Insurance premiums spike. Global supply chain delays. Oil price volatility.",
    politicalImpact: "Yemen war expansion. Saudi Arabia drawn into direct conflict. Iran proxy network tested. US military commitment to Gulf security reaffirmed or questioned.",
    marketSignals: ["Shipping stocks drop", "Oil volatility increases", "Defense contractors rise", "Suez traffic data", "LNG spot prices"],
    affectedCountries: ["US", "EU", "CN", "IL"],
    timeframe: "3-12 months",
  },
  {
    id: "hezbollah-war",
    title: "Full-Scale Israel-Hezbollah War",
    riskLevel: "Critical",
    probability: "Medium",
    trigger: "Hezbollah launches massive rocket barrage on Israeli cities, or Israel launches preemptive war to push Hezbollah back from northern border",
    economicImpact: "Israeli economy severely disrupted. Tourism collapses. Tech sector disruption. Lebanese economic collapse. Regional investment flight.",
    politicalImpact: "Iran directly involved. Syria destabilized further. US forced to intervene. Russia uses Syria base for intelligence. China calls for ceasefire. Gulf states split.",
    marketSignals: ["TA-35 drops >15%", "ILS/USD weakens", "Oil spike", "Gold surge", "Israeli bond yields rise"],
    affectedCountries: ["US", "IL", "RU", "EU"],
    timeframe: "6-18 months",
  },
  {
    id: "gulf-state-pivot",
    title: "Gulf State China Pivot",
    riskLevel: "High",
    probability: "Medium",
    trigger: "Saudi Arabia or UAE announce major oil sales in RMB, join BRICS, or grant China military basing rights in the Gulf",
    economicImpact: "Dollar dominance challenged. US Treasury market disruption. Petrodollar recycling reduced. Chinese financial influence expands. US sanctions effectiveness reduced.",
    politicalImpact: "US regional influence severely reduced. Israel loses Arab state buffer against Iran. China gains strategic foothold. Russia benefits from US-Gulf rift.",
    marketSignals: ["USD index drops", "US Treasury yields rise", "Gold surge", "RMB appreciation", "Saudi Aramco Chinese investment"],
    affectedCountries: ["US", "CN", "IL", "EU", "RU"],
    timeframe: "24-60 months",
  },
];

// ============================================================
// LIVE DATA CONFIGURATIONS
// ============================================================

export const LIVE_DATA_CONFIGS: LiveDataConfig[] = [
  // US Indices
  { symbol: "^GSPC", name: "S&P 500", country: "US", type: "index" },
  { symbol: "^IXIC", name: "NASDAQ", country: "US", type: "index" },
  { symbol: "^DJI", name: "Dow Jones", country: "US", type: "index" },
  // China Indices
  { symbol: "000001.SS", name: "Shanghai Comp", country: "CN", type: "index" },
  { symbol: "^HSI", name: "Hang Seng", country: "CN", type: "index" },
  // Europe Indices
  { symbol: "^GDAXI", name: "DAX", country: "EU", type: "index" },
  { symbol: "^FCHI", name: "CAC 40", country: "EU", type: "index" },
  { symbol: "^FTSE", name: "FTSE 100", country: "EU", type: "index" },
  // Russia Index
  { symbol: "IMOEX.ME", name: "MOEX Russia", country: "RU", type: "index" },
  // Israel Index
  { symbol: "TA35.TA", name: "Tel Aviv 35", country: "IL", type: "index" },
  // Canada Index
  { symbol: "^GSPTSE", name: "TSX Composite", country: "CA", type: "index" },
  // Global Commodities
  { symbol: "CL=F", name: "WTI Crude", country: "GLOBAL", type: "commodity" },
  { symbol: "BZ=F", name: "Brent Crude", country: "GLOBAL", type: "commodity" },
  { symbol: "GC=F", name: "Gold", country: "GLOBAL", type: "commodity" },
  { symbol: "NG=F", name: "Natural Gas", country: "GLOBAL", type: "commodity" },
  { symbol: "ZW=F", name: "Wheat", country: "GLOBAL", type: "commodity" },
  // Currencies
  { symbol: "EURUSD=X", name: "EUR/USD", country: "GLOBAL", type: "currency" },
  { symbol: "USDRUB=X", name: "USD/RUB", country: "RU", type: "currency" },
  { symbol: "USDCNY=X", name: "USD/CNY", country: "CN", type: "currency" },
  { symbol: "USDILS=X", name: "USD/ILS", country: "IL", type: "currency" },
  { symbol: "USDCAD=X", name: "USD/CAD", country: "CA", type: "currency" },
];

// ============================================================
// SUGGESTED QUESTIONS
// ============================================================

export const SUGGESTED_QUESTIONS: string[] = [
  "What does current oil price movement signal about US-Iran tensions?",
  "How is the US-China trade war affecting Middle East alignment?",
  "What are Russia's strategic options in the Middle East given Ukraine war costs?",
  "Assess the likelihood of Saudi-Israel normalization given current market signals",
  "How does China's energy dependence shape its Middle East policy?",
  "What would a Strait of Hormuz closure mean for global markets?",
  "Analyze the Israel-Russia relationship and its Syria dimension",
  "What does the gold price signal about geopolitical risk levels?",
  "How is Europe's energy pivot from Russia affecting Gulf state leverage?",
  "Assess the danger level of current Iran nuclear program trajectory",
  "What are the most dangerous scenarios for the Middle East in 2025-2026?",
  "How does Canada's US dependence limit its Middle East policy options?",
];
