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

## Pending / Future Enhancements
- [ ] Add more country pairs (US-CA, CN-CA, RU-IL)
- [ ] Add news feed integration (GDELT or NewsAPI) for real-time events
- [ ] Add historical chart visualization for key indicators
- [ ] Add user authentication for saved analysis sessions
- [ ] Add export functionality (PDF briefing reports)
- [ ] Add alert system for significant market movements
