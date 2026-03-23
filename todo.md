# GEOPOL-INT — Project TODO

## Research & Architecture
- [x] Deep research: Economic pillars for US, China, Canada, Israel, Russia, Europe
- [x] Deep research: Country-pair relationship matrices (10 pairs)
- [x] Deep research: Middle East dynamics and impact scoring
- [x] Design data architecture: country profiles, pair analysis, scenario schemas
- [x] Design Intelligence Terminal UI aesthetic

## Core Application
- [x] Initialize project (full-stack: React + Express + tRPC + DB)
- [x] Intelligence Terminal dark theme (Space Grotesk + IBM Plex Mono)
- [x] Three-column layout: Country Sidebar + Chat + Analysis Panel
- [x] Live market ticker bar with real-time prices
- [x] Country sidebar with live market change indicators

## AI Chat Engine
- [x] Backend LLM streaming endpoint (/api/geopol/chat)
- [x] System prompt with full geopolitical knowledge base
- [x] Streaming response rendering with Streamdown markdown
- [x] Country-pair detection from natural language questions
- [x] Suggested query shortcuts
- [x] Chat history context (last 10 messages)

## Live Market Data
- [x] Backend market data proxy (/api/market-data) to avoid CORS
- [x] Yahoo Finance v8 API integration (16 key symbols)
- [x] Mock data fallback when API unavailable
- [x] Auto-refresh every 5 minutes
- [x] Market data injected into LLM system prompt

## Analysis Panels (Right Panel)
- [x] Bilateral Relationship Matrix with 10 country pairs
- [x] Tension/cooperation scores with visual bars
- [x] Middle East impact scores
- [x] Market data panel by country
- [x] Middle East scenarios panel (risk levels + probabilities)

## Geopolitical Knowledge Base
- [x] 6 country profiles (US, China, Russia, Israel, Canada, Europe)
- [x] 10 bilateral pair analyses with full structured data
- [x] 8 Middle East risk scenarios
- [x] Live data configurations for 20+ market symbols

## Testing
- [x] Unit tests: market data proxy (3 tests)
- [x] Unit tests: chat streaming endpoint (4 tests)
- [x] Unit tests: SSE stream parsing (3 tests)
- [x] Unit tests: geopolitical data integrity (4 tests)
- [x] Auth logout test (1 test)
- [x] All 15 tests passing

## Bug Fixes
- [x] Fix mobile view chat box — layout, input, and scrolling broken on small screens

## Pending / Future Enhancements
- [ ] Add more country pairs (US-CA, CN-CA, RU-IL)
- [ ] Add news feed integration (GDELT or NewsAPI) for real-time events
- [ ] Add historical chart visualization for key indicators
- [ ] Add user authentication for saved analysis sessions
- [ ] Add export functionality (PDF briefing reports)
- [ ] Add alert system for significant market movements

## WRDI Framework Integration
- [x] Add WRDI data schema: 4 dimensions (Political 25%, Military 30%, Economic 25%, Social 20%)
- [x] Build WRDI scoring engine with composite risk score 1-10
- [x] Add per-country WRDI scores driven by live market data
- [x] Add per-pair WRDI differential analysis
- [x] Rebuild chat engine to be conversational (short, focused replies, not long essays)
- [x] Add WRDI Report side panel with live scored metrics and dimension breakdown
- [x] Add daily monitoring log view in the WRDI panel (recent events per country)
- [x] Add weekly report generation from WRDI scores

## Bug Fixes
- [x] Fix TypeError crash in generateWeeklyReport when scores array is empty (topRisk undefined)

## Chat Engine Constraints
- [x] Rewrite system prompt so chatbot answers only from structured in-code data (no general LLM knowledge)
- [x] Inject full country profiles, WRDI scores, pair matrices, market data, and scenarios into every LLM call
- [x] Add explicit instruction: if data does not cover the question, say so rather than speculate

## Automated Intelligence Pipeline
- [x] Migrate knowledge base (country profiles, pairs, scenarios) from static TS file to database tables
- [x] Build GDELT API integration for real-time global news/event ingestion
- [x] Build ACLED API integration for armed conflict data
- [x] Build UNHCR API integration for refugee/displacement data
- [x] Build World Bank + IMF API integration for economic indicators
- [x] Build EIA API integration for energy data
- [x] Build LLM event classification engine (country, dimension, severity, affected fields)
- [x] Build knowledge base field updater (rewrites DB fields from classified events)
- [x] Build WRDI score recalculation from live events + market data
- [x] Build pipeline change log (timestamp, source, event, fields changed)
- [x] Build scheduled pipeline runner (every 6 hours)
- [x] Build admin panel showing pipeline logs and knowledge base diffs
- [x] Update chatbot to read from database instead of static TS file
- [x] Add metric definition tooltips (hover over any WRDI metric to see its definition)
- [x] Archive previous knowledge base versions before each update

## Bug Fixes — WRDI Panel
- [x] Fix SCORES tab showing no data (WRDI scores not computing — market data not reaching component)
- [x] Fix PAIRS tab showing no data (same root cause)
- [x] Fix REPORT tab stuck on "Market data is still loading" even after data loads

## ACLED Live Integration
- [x] Store ACLED credentials as secure environment secrets (ACLED_EMAIL, ACLED_PASSWORD)
- [x] Implement OAuth2 token fetch in pipeline (POST to acleddata.com/oauth/token)
- [x] Implement ACLED data fetch with 6-hour rolling window and 100-event limit
- [x] Wire ACLED events into LLM classification for Military dimension scoring
- [x] Test ACLED connection end-to-end

## Bug Fixes — WRDI Blank Tabs (Round 2)
- [x] Fix SCORES and PAIRS tabs blank — root cause: country ID mismatch (COUNTRIES uses uppercase US/CN/RU, COUNTRY_PROFILES uses lowercase us/china/russia). Fixed by adding UPPERCASE_TO_PROFILE_KEY reverse map in wrdiEngine.ts
- [x] Fix generateDangerousScenario using hardcoded lowercase IDs for comparison — updated to normalize IDs before comparison
- [x] Fix EU currency lookup (EUR/USD stored as GLOBAL not EU) — added special case in getMarketValue
- [x] Add 8 new unit tests for country ID normalization (47 tests total, all passing)

## Feature: User Claim Fact-Check & KB Update
- [x] Build factcheck.ts engine: claim extraction → GDELT search → LLM verification → KB update
- [x] Add /api/geopol/factcheck endpoint to geopol.ts
- [x] Add /api/geopol/kb-snapshot endpoint to geopol.ts
- [x] Update chatEngine.ts to accept LiveKBData and re-stream with updated KB
- [x] Update Home.tsx sendMessage: call factcheck in parallel, show status indicator, re-stream on KB update
- [x] Add factCheckStatus UI indicator in chat header (green=verified, red=contradicted, cyan=info)
- [x] Write 10 unit tests for fact-check engine (56 total, all passing)
- [x] Add top-level try-catch in factCheckUserClaim for graceful error handling

## Bug Fix — Fact-Check Race Condition
- [x] Fix sendMessage: factcheck now runs BEFORE stream starts (was parallel/too late)
- [x] Show "Searching external sources..." status in chat while factcheck runs (before stream begins)
- [x] Stream only starts after factcheck completes; passes updated KB snapshot if KB was updated
- [x] Contradicted claims: prepend warning note before the answer
- [x] KB-updated claims: append verification note at the end of the answer

## Feature: Web Search Fallback
- [x] Fix GDELT query URL bug: encodeURIComponent was converting spaces to %20, breaking the GDELT parser. Fixed to use plain + separator
- [x] Update system prompt: removed hard "refuse if outside KB" rule. Bot now analyzes using country profiles and relationship data for events not in KB
- [x] Update system prompt: NEVER say "outside my data coverage" — always provide best analysis using available context
- [x] Update REMINDER: use KB as primary source, not exclusive source

## Feature: Real-Time News Context Injection
- [x] Add NewsArticle interface to FactCheckResult and return articles from all return paths
- [x] Pass newsContext articles through factcheck endpoint to frontend
- [x] Add NewsArticle type to chatEngine.ts and streamChatResponse signature
- [x] Inject articles as REAL-TIME NEWS CONTEXT section in buildSystemPrompt when available
- [x] System prompt instructs bot to USE articles and cite source domain
- [x] System prompt adds KB update timestamp note: "Note: KB updates every 6 hours. This answer incorporates live news retrieved at [time]."
- [x] sendMessage extracts liveNewsContext from factcheck result and passes to streamChatResponse
- [x] Status indicator shows article count when news found but unverified
- [x] 56 tests passing

## Upgrade: GDELT Search Coverage
- [x] Tiered time windows: try 24h first, then 48h, then 7 days
- [x] Fixed country filter syntax in GDELT URL (encodeURIComponent was breaking query)
- [x] Improved extractClaim keyword generation for geographic specifics (Strait of Hormuz, Houthi, etc.)
- [x] Added fallback query without country filter when primary returns 0 results

## Upgrade: Neutral Language — Remove Biased Terminology
- [x] Replaced "Iranian proxy network" with "Iran-aligned armed faction capabilities" in geopoliticalData.ts
- [x] Replaced "proxy positioning" and "Iran proxy" in wrdiEngine.ts
- [x] Replaced "proxy conflicts" and "Proxy conflict involvement" in WRDIPanel.tsx
- [x] Added NEUTRAL LANGUAGE rule 6 to system prompt in chatEngine.ts (applies to all languages including Arabic)
- [x] 56 tests passing, 0 TypeScript errors

## Feature: Glossary Page
- [x] Build Glossary page component (dark terminal theme, searchable, filterable by section)
- [x] Section 1: WRDI Indicators — 4 dimensions, score bands (VERY LOW → CRITICAL), formula
- [x] Section 2: UI Elements — all tabs and panels explained (MATRIX, MARKETS, RISKS, PIPELINE, SCORES, PAIRS, REPORT)
- [x] Section 3: Geopolitical Terms — WRDI Differential, Tension Score, Middle East Impact, Bilateral Pair, etc.
- [x] Add GLOSSARY button to top navigation bar in Home.tsx
- [x] Register /glossary route in App.tsx
- [x] Add back navigation from Glossary page to main interface

## Feature: New Country Profiles (Iran, India, GCC)
- [x] Add Iran (IR) country profile to geopoliticalData.ts with full WRDI dimensions
- [x] Add India (IN) country profile to geopoliticalData.ts with full WRDI dimensions
- [x] Add GCC (Gulf Cooperation Council) unified profile to geopoliticalData.ts with full WRDI dimensions
- [x] Add WRDI engine profiles for IR, IN, GCC in wrdiEngine.ts
- [x] Add IR, IN, GCC to COUNTRIES array and LIVE_DATA_CONFIGS (market symbols)
- [x] Add IR, IN, GCC to pipeline COUNTRY_IDS, COUNTRY_NAMES, and GDELT_COUNTRY_MAP

## Feature: New Bilateral Pairs (9 new pairs)
- [x] IR-US: Iran–United States (adversarial, nuclear/sanctions focus)
- [x] IR-IL: Iran–Israel (high tension, military/nuclear)
- [x] IR-RU: Iran–Russia (strategic alignment, energy/arms)
- [x] IN-CN: India–China (border tension, economic rivalry)
- [x] IN-US: India–United States (strategic partnership, Indo-Pacific)
- [x] IN-RU: India–Russia (historical ties, energy/defense)
- [x] GCC-IR: Gulf States–Iran (sectarian/regional rivalry)
- [x] GCC-US: Gulf States–United States (security alliance, oil)
- [x] GCC-IL: Gulf States–Israel (normalization, Abraham Accords)

## Feature: Local News RSS Sources
- [x] Add IRNA RSS feed (Iranian state news) to pipeline
- [x] Add PressTV RSS feed (Iranian English-language) to pipeline
- [x] Add Mehr News RSS feed (Iranian) to pipeline
- [x] Add Xinhua RSS feed (Chinese state news) to pipeline
- [x] Add Global Times RSS feed (Chinese English-language) to pipeline
- [x] Add CGTN RSS feed (Chinese international) to pipeline
- [x] Add TASS RSS feed (Russian state news) to pipeline
- [x] Add RT RSS feed (Russian English-language) to pipeline
- [x] Add Sputnik RSS feed (Russian international) to pipeline
- [x] Add The Hindu RSS feed (Indian independent) to pipeline
- [x] Add NDTV RSS feed (Indian independent) to pipeline
- [x] Add Al Jazeera RSS feed (Gulf/Middle East) to pipeline
- [x] Add Arab News RSS feed (Gulf) to pipeline
- [x] Add Gulf News RSS feed (Gulf) to pipeline
- [x] RSS fetcher parses both RSS and Atom formats, filters to last 48h
- [x] Source bias metadata (state/independent) included in raw event data
- [x] Pipeline classifyEvent prompt updated to include IR, IN, GCC as monitored countries

## Feature: PWA (Progressive Web App)
- [x] إنشاء manifest.json مع اسم التطبيق وألوان وأيقونات
- [x] توليد أيقونات بأحجام مختلفة (72, 96, 128, 144, 152, 192, 384, 512, apple-touch-icon)
- [x] إضافة Service Worker للتخزين المؤقت (cache-first + network-first strategy)
- [x] إضافة mobile meta tags في index.html (viewport, theme-color, apple, OG)
- [x] إضافة apple-touch-icon لـ iOS
- [x] إضافة PWAInstallPrompt component (Android + iOS instructions)
- [x] إضافة safe-area-inset CSS variables لـ notch support

## Feature: Expanded RSS Sources + Fast Pipeline (15 min)

### RSS Sources (new)
- [ ] Reuters: Top News, World, Business, Markets
- [ ] Bloomberg: Markets, Politics, Technology
- [ ] AP News: World, Politics, Business
- [ ] WSJ: World News, Markets
- [ ] Financial Times: World, Markets
- [ ] The Economist: Latest
- [ ] CNBC: World, Markets, Economy
- [ ] Times of Israel: Latest
- [ ] Jerusalem Post: Latest
- [ ] Haaretz: Latest
- [ ] i24 News English: Latest
- [ ] Moscow Times: Latest
- [ ] Iran International English: Latest
- [ ] South China Morning Post: Latest
- [ ] Caixin Global: Latest
- [ ] IMF News: Latest
- [ ] World Bank News: Latest (RSS only, not API)

### Pipeline Split
- [ ] تقسيم pipeline إلى runFastPipeline (RSS + GDELT فقط) وrunFullPipeline (كل المصادر)
- [ ] جدولة runFastPipeline كل 15 دقيقة
- [ ] إبقاء runFullPipeline كل 6 ساعات (ACLED + World Bank + EIA)
- [ ] إضافة حقل source_type في pipeline log (fast/full)
- [ ] إضافة مؤشر "FAST" vs "FULL" في Pipeline tab بالواجهة
- [ ] تحديث pipeline status في Admin panel ليعرض آخر تشغيل سريع وآخر تشغيل كامل
