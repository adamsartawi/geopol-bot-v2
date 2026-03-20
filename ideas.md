# Geopolitical Intelligence Engine — Design Brainstorm

## Project Context
A geopolitical intelligence chatbot that reads live economic/market data from US, China, Russia, Israel, Canada, and Europe to anticipate political decisions and measure impact on the Middle East. Users interact via structured country-pair analysis and open questions.

---

<response>
<idea>

**Design Movement: Intelligence Terminal / Cold War Cartography**

**Core Principles:**
1. Information density over decoration — every pixel serves data
2. Monochromatic base with surgical accent colors for threat/opportunity signals
3. Asymmetric split layout: persistent sidebar for country selector, main area for analysis
4. Typography as hierarchy — data labels, body, and headers use three distinct typefaces

**Color Philosophy:**
- Background: near-black slate (#0A0E14) — evokes classified briefing rooms
- Primary text: off-white (#E8EDF2)
- Accent 1: Amber (#F59E0B) — used for warnings, high-risk signals
- Accent 2: Cyan (#06B6D4) — used for data points, live indicators
- Accent 3: Red (#EF4444) — used for danger/conflict signals
- Muted: #1E2530 — card backgrounds
- Emotional intent: gravitas, authority, precision

**Layout Paradigm:**
- Three-column: narrow left rail (country flags + quick-select), wide center (chat + analysis), narrow right rail (live data tickers)
- Chat messages styled as intelligence briefing cards with classification-style headers
- Country-pair selector as a relationship matrix grid (6x6 clickable cells)

**Signature Elements:**
1. Animated world map background (SVG, subtle pulse on active regions)
2. "Signal strength" indicators — live data freshness shown as radar-style rings
3. Analysis cards styled as declassified documents with redaction bars

**Interaction Philosophy:**
- Clicking a country pair loads a pre-built analysis brief instantly
- Chat input styled as a secure terminal prompt
- Hover states reveal data source attribution

**Animation:**
- Subtle scanline effect on hero area
- Data tickers scroll horizontally in right rail
- Analysis cards fade in with a slight upward translate
- Map regions pulse when referenced in analysis

**Typography System:**
- Display: Space Grotesk Bold — for headers and country names
- Body: IBM Plex Mono — for data values, indicators, and terminal-style chat
- UI Labels: Inter 400 — for navigation and metadata

</idea>
<probability>0.08</probability>
</response>

<response>
<idea>

**Design Movement: Brutalist Data Journalism**

**Core Principles:**
1. Raw information architecture — no decorative chrome
2. High-contrast typographic hierarchy as the primary visual language
3. Newspaper-inspired grid with irregular column widths
4. Color used only to encode meaning, never aesthetics

**Color Philosophy:**
- Background: warm white (#FAFAF7)
- Primary: deep charcoal (#1A1A1A)
- Accent: blood red (#C0392B) — used for conflict/risk
- Secondary accent: forest green (#1B5E20) — used for economic strength
- Muted: #F0EDE8
- Emotional intent: journalistic authority, urgency, objectivity

**Layout Paradigm:**
- Newspaper-style masonry grid for analysis cards
- Full-width header with scrolling news ticker
- Chat interface embedded in a sidebar column

**Signature Elements:**
1. Bold oversized country names as section dividers
2. Data tables styled as newspaper box scores
3. Risk level shown as typographic weight (thin = low, black = critical)

**Interaction Philosophy:**
- Clicking expands inline, like a newspaper article fold
- No modals — everything unfolds in place

**Animation:**
- Minimal — only essential transitions
- Text reveals on scroll like a printing press

**Typography System:**
- Display: Playfair Display Black — editorial authority
- Body: Source Serif 4 — readable long-form
- Data: JetBrains Mono — for numbers and indicators

</idea>
<probability>0.06</probability>
</response>

<response>
<idea>

**Design Movement: Strategic Operations Dashboard / OSINT Platform**

**Core Principles:**
1. Dark mode by default — reduces eye strain for long analysis sessions
2. Modular card system — each analysis component is self-contained
3. Color-coded threat matrix — consistent semantic color across all signals
4. Left sidebar navigation with collapsible country/region tree

**Color Philosophy:**
- Background: deep navy (#0D1B2A)
- Surface: #1A2942
- Primary accent: electric blue (#3B82F6)
- Success/positive: emerald (#10B981)
- Warning: amber (#F59E0B)
- Danger: crimson (#DC2626)
- Neutral: slate (#64748B)
- Emotional intent: professional intelligence platform, trustworthy, analytical

**Layout Paradigm:**
- Fixed left sidebar: country/region navigator + quick analysis buttons
- Main content: split between chat interface (top 60%) and live data panel (bottom 40%)
- Right panel: country-pair relationship matrix + active indicators

**Signature Elements:**
1. Relationship matrix — 6x6 grid showing relationship health as colored cells
2. Live economic ticker bar at top
3. Analysis output styled as structured intelligence reports

**Interaction Philosophy:**
- Country pair selection drives the entire analysis context
- Chat questions are pre-suggested based on selected pair
- All data points are clickable to show source

**Animation:**
- Smooth panel transitions with easing
- Number counters animate on data load
- Chat messages stream in token by token

**Typography System:**
- Display: Syne Bold — modern, technical authority
- Body: DM Sans — clean, readable
- Data: Fira Code — for all numeric indicators

</idea>
<probability>0.07</probability>
</response>

---

## Selected Design: Intelligence Terminal / Cold War Cartography

**Rationale:** The subject matter — geopolitical intelligence, economic signals, political risk — demands an interface that feels like a classified briefing room, not a consumer app. The dark, high-contrast terminal aesthetic with amber/cyan accent colors creates immediate authority and makes data density feel intentional rather than overwhelming. The three-column layout maximizes information visibility while keeping the chat interaction central.

---

## Data Architecture

### Free APIs to Integrate

| API | Data Provided | Endpoint |
|-----|--------------|----------|
| Yahoo Finance (via yfinance proxy) | Stock indices, equity prices | Public |
| FRED (Federal Reserve) | US macro indicators | api.stlouisfed.org |
| World Bank API | GDP, inflation, trade balance | api.worldbank.org |
| ExchangeRate-API | Currency rates | exchangerate-api.com |
| Alpha Vantage (free tier) | Stock prices, forex | alphavantage.co |
| NewsAPI | Geopolitical news headlines | newsapi.org |

### Country Profile Schema

Each country has:
- `indices`: Array of {name, symbol, value, change}
- `commodities`: Array of {name, price, change, unit}
- `macro`: {gdp_growth, inflation, unemployment, trade_balance, currency_rate}
- `risk_score`: 0-100 composite
- `geopolitical_posture`: string
- `middle_east_interests`: string[]

### Country-Pair Analysis Schema

Each pair has:
- `relationship_type`: Allied | Competitive | Transactional | Hostile | Mixed
- `economic_dependency`: {trade_volume, direction, key_sectors}
- `tension_score`: 0-100
- `cooperation_score`: 0-100
- `middle_east_impact`: string
- `political_anticipation`: string[]
- `leverage_holder`: string
- `dangerous_scenario`: string
- `remaining_options`: string[]
