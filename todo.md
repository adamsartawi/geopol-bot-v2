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
