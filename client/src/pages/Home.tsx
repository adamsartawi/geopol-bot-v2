// ============================================================
// GEOPOLITICAL INTELLIGENCE ENGINE — Main Interface
// Design: Intelligence Terminal / Cold War Cartography
// Layout: Left sidebar (country nav) + Center (chat) + Right (data)
// ============================================================

import { useState, useRef, useEffect, useCallback } from "react";
import { nanoid } from "nanoid";
import { Streamdown } from "streamdown";
import { ChatMessage, streamChatResponse, generatePairBrief, detectPairFromQuestion } from "@/lib/chatEngine";
import { COUNTRIES, COUNTRY_PAIRS, MIDDLE_EAST_SCENARIOS, SUGGESTED_QUESTIONS } from "@/lib/geopoliticalData";
import { useMarketData } from "@/hooks/useMarketData";
import CountrySidebar from "@/components/CountrySidebar";
import MarketTicker from "@/components/MarketTicker";
import RelationshipMatrix from "@/components/RelationshipMatrix";
import MarketPanel from "@/components/MarketPanel";
import ScenarioPanel from "@/components/ScenarioPanel";
import { MiddleEastScenario } from "@/lib/geopoliticalData";
import { Send, RefreshCw, AlertTriangle, Zap, Globe, ChevronRight } from "lucide-react";

export default function Home() {

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [activePanel, setActivePanel] = useState<"matrix" | "market" | "scenarios">("matrix");
  const [selectedPair, setSelectedPair] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { marketData, loading: marketLoading, lastUpdated, usingMockData, refresh } = useMarketData();

  // Welcome message
  useEffect(() => {
    const welcome: ChatMessage = {
      id: nanoid(),
      role: "assistant",
      content: `## GEOPOL-INT SYSTEM ONLINE

**Intelligence Engine Active** — Monitoring 6 major economies and their geopolitical posture toward the Middle East.

I analyze real-time market data as political signals and anticipate the nature of upcoming decisions based on each country's best economic interests.

**Capabilities:**
- **Country-Pair Analysis**: Select any two countries from the matrix to get a structured bilateral intelligence brief
- **Political Anticipation**: Based on current market data, I assess likely political moves in the next 12-24 months
- **Middle East Impact**: Every analysis includes a dedicated assessment of regional impact
- **Scenario Assessment**: Evaluate the most dangerous emerging scenarios and their market signals

**Select a country pair from the matrix** or ask me anything about current geopolitical dynamics.`,
      timestamp: new Date(),
      analysisType: "general",
    };
    setMessages([welcome]);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isStreaming) return;

    setInput("");
    setIsStreaming(true);

    const userMsg: ChatMessage = {
      id: nanoid(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    const assistantId = nanoid();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      analysisType: "general",
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);

    try {
      // Detect if asking about a pair
      const detectedPair = detectPairFromQuestion(text);
      if (detectedPair) {
        setSelectedPair(detectedPair.id);
      }

      const allMessages = [...messages, userMsg];
      let fullContent = "";

      for await (const chunk of streamChatResponse(allMessages, marketData)) {
        fullContent += chunk;
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId
              ? { ...m, content: fullContent }
              : m
          )
        );
      }
    } catch (error) {
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, content: "**SIGNAL INTERRUPTED** — Unable to connect to intelligence engine. Please check your connection and retry." }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  }, [input, isStreaming, messages, marketData]);

  const handlePairSelect = useCallback((pairId: string) => {
    setSelectedPair(pairId);
    const pair = COUNTRY_PAIRS.find(p => p.id === pairId);
    if (!pair) return;
    const c1 = COUNTRIES.find(c => c.id === pair.country1);
    const c2 = COUNTRIES.find(c => c.id === pair.country2);
    const brief = generatePairBrief(pairId, marketData);
    sendMessage(brief);
  }, [marketData, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top ticker bar */}
      <MarketTicker marketData={marketData} loading={marketLoading} />

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — Country Navigator */}
        <CountrySidebar
          countries={COUNTRIES}
          marketData={marketData}
          onCountrySelect={(countryId: string) => {
            const country = COUNTRIES.find(c => c.id === countryId);
            if (country) {
              sendMessage(`Provide a comprehensive geopolitical and economic intelligence brief on ${country.name}. Include current market signals, key vulnerabilities, geopolitical posture, and Middle East interests.`);
            }
          }}
        />

        {/* Center — Chat Interface */}
        <div className="flex-1 flex flex-col min-w-0 border-x border-border">
          {/* Chat header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card/50">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-bold tracking-tight text-sm text-foreground">INTELLIGENCE CHANNEL</span>
              <span className="font-mono text-xs tracking-wide text-muted-foreground text-xs">
                {lastUpdated ? `UPDATED ${lastUpdated.toLocaleTimeString()}` : "CONNECTING..."}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {usingMockData && (
                <span className="font-mono text-xs tracking-wide text-xs text-amber-400 flex items-center gap-1">
                  <AlertTriangle size={10} />
                  DEMO DATA
                </span>
              )}
              <button
                onClick={refresh}
                className="text-muted-foreground hover:text-amber-400 transition-colors p-1"
                title="Refresh market data"
              >
                <RefreshCw size={13} className={marketLoading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`animate-in fade-in slide-in-from-bottom-2 duration-300 ${msg.role === "user" ? "flex justify-end" : "flex justify-start"}`}
              >
                {msg.role === "assistant" ? (
                  <div className="max-w-[90%] w-full">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span className="font-mono text-xs tracking-wide text-amber-400 text-xs">GEOPOL-INT</span>
                      <span className="font-mono text-xs tracking-wide text-muted-foreground text-xs">
                        {msg.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="bg-card border border-amber-500/20 rounded-sm p-4 rounded-sm">
                      {msg.content ? (
                        <div className="prose prose-invert prose-sm max-w-none
                          prose-headings:font-['Space_Grotesk'] prose-headings:font-bold prose-headings:text-amber-400
                          prose-h2:text-base prose-h2:border-b prose-h2:border-amber-500/20 prose-h2:pb-1 prose-h2:mb-2
                          prose-h3:text-sm prose-h3:text-cyan-400
                          prose-p:text-foreground/90 prose-p:leading-relaxed prose-p:text-sm
                          prose-strong:text-foreground prose-strong:font-semibold
                          prose-li:text-foreground/85 prose-li:text-sm
                          prose-ul:space-y-0.5 prose-ol:space-y-0.5
                          prose-code:text-cyan-400 prose-code:bg-cyan-500/10 prose-code:px-1 prose-code:rounded-sm prose-code:text-xs prose-code:font-mono
                          prose-blockquote:border-l-amber-500 prose-blockquote:text-muted-foreground">
                          <Streamdown>{msg.content}</Streamdown>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                          </div>
                          <span className="font-mono text-xs tracking-wide text-muted-foreground text-xs">PROCESSING INTELLIGENCE...</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="max-w-[75%]">
                    <div className="flex items-center justify-end gap-2 mb-1.5">
                      <span className="font-mono text-xs tracking-wide text-muted-foreground text-xs">
                        {msg.timestamp.toLocaleTimeString()}
                      </span>
                      <span className="font-mono text-xs tracking-wide text-cyan-400 text-xs">ANALYST</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    </div>
                    <div className="bg-card border border-cyan-500/20 rounded-sm p-3 rounded-sm">
                      <p className="text-sm text-foreground/90 leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Suggested questions */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2">
              <p className="font-mono text-xs tracking-wide text-muted-foreground text-xs mb-2">SUGGESTED QUERIES:</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_QUESTIONS.slice(0, 4).map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    className="text-xs px-2.5 py-1 rounded-sm border border-border hover:border-amber-500/40 hover:text-amber-400 text-muted-foreground transition-all duration-200 flex items-center gap-1"
                  >
                    <ChevronRight size={10} />
                    {q.length > 50 ? q.substring(0, 50) + "..." : q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input area */}
          <div className="p-4 border-t border-border bg-card/30">
            <div className="flex gap-2 items-end">
              <div className="flex-1 relative">
                <div className="absolute left-3 top-3 font-mono text-amber-400 text-xs select-none">❯</div>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Query the intelligence engine... (e.g., 'What does oil price signal about US-Iran tensions?')"
                  className="w-full bg-input border border-border rounded-sm pl-7 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:border-amber-500/50 focus:ring-0 font-mono min-h-[44px] max-h-[120px]"
                  rows={1}
                  disabled={isStreaming}
                />
              </div>
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isStreaming}
                className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-sm text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 flex-shrink-0"
              >
                <Send size={16} />
              </button>
            </div>
            <p className="font-mono text-xs tracking-wide text-muted-foreground/40 text-xs mt-1.5 pl-7">
              ENTER to send · SHIFT+ENTER for new line · Data refreshes every 5 minutes
            </p>
          </div>
        </div>

        {/* Right panel — Analysis Tools */}
        <div className="w-80 flex flex-col border-l border-border overflow-hidden">
          {/* Panel tabs */}
          <div className="flex border-b border-border">
            {[
              { id: "matrix", label: "MATRIX", icon: Globe },
              { id: "market", label: "MARKETS", icon: Zap },
              { id: "scenarios", label: "SCENARIOS", icon: AlertTriangle },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActivePanel(id as typeof activePanel)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 font-mono text-xs transition-all duration-200 ${
                  activePanel === id
                    ? "text-amber-400 border-b-2 border-amber-400 bg-amber-500/5"
                    : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"
                }`}
              >
                <Icon size={11} />
                {label}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto">
            {activePanel === "matrix" && (
              <RelationshipMatrix
                pairs={COUNTRY_PAIRS}
                countries={COUNTRIES}
                selectedPair={selectedPair}
                onPairSelect={handlePairSelect}
              />
            )}
            {activePanel === "market" && (
              <MarketPanel
                marketData={marketData}
                countries={COUNTRIES}
                loading={marketLoading}
              />
            )}
            {activePanel === "scenarios" && (
              <ScenarioPanel
                scenarios={MIDDLE_EAST_SCENARIOS}
                onScenarioSelect={(scenario: MiddleEastScenario) => {
                  sendMessage(`Analyze the "${scenario.title}" scenario in detail. Trigger: ${scenario.trigger}. Assess probability, economic impact, political impact, and what market signals we should watch for. What can each major power do to prevent or exploit this scenario?`);
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
