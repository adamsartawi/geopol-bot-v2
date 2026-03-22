// ============================================================
// GEOPOLITICAL INTELLIGENCE ENGINE — Main Interface
// Design: Intelligence Terminal / Cold War Cartography
// Layout: Desktop: Left sidebar + Center chat + Right WRDI panel
//         Mobile:  Bottom tab navigation with full-screen views
// ============================================================

import { useState, useRef, useEffect, useCallback } from "react";
import { nanoid } from "nanoid";
import { Streamdown } from "streamdown";
import { ChatMessage, streamChatResponse, generatePairBrief, detectPairFromQuestion, LiveKBData } from "@/lib/chatEngine";
import { COUNTRIES, COUNTRY_PAIRS, MIDDLE_EAST_SCENARIOS, SUGGESTED_QUESTIONS } from "@/lib/geopoliticalData";
import { useMarketData } from "@/hooks/useMarketData";
import CountrySidebar from "@/components/CountrySidebar";
import MarketTicker from "@/components/MarketTicker";
import RelationshipMatrix from "@/components/RelationshipMatrix";
import MarketPanel from "@/components/MarketPanel";
import ScenarioPanel from "@/components/ScenarioPanel";
import WRDIPanel from "@/components/WRDIPanel";
import PipelinePanel from "@/components/PipelinePanel";
import { MiddleEastScenario } from "@/lib/geopoliticalData";
import {
  Send, RefreshCw, AlertTriangle, Zap, Globe,
  ChevronRight, MessageSquare, Map, BarChart2, Activity, Cpu,
  SearchCheck
} from "lucide-react";

export default function Home() {

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeRightPanel, setActiveRightPanel] = useState<"wrdi" | "matrix" | "market" | "scenarios" | "pipeline">("wrdi");
  const [mobileTab, setMobileTab] = useState<"chat" | "countries" | "matrix" | "wrdi" | "market">("chat");
  const [selectedPair, setSelectedPair] = useState<string | null>(null);
  const [factCheckStatus, setFactCheckStatus] = useState<{ text: string; type: "ok" | "warn" | "info" } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { marketData, loading: marketLoading, lastUpdated, usingMockData, refresh } = useMarketData();

  // Welcome message — conversational tone
  useEffect(() => {
    const welcome: ChatMessage = {
      id: nanoid(),
      role: "assistant",
      content: `**GEOPOL-INT online.** I'm monitoring 6 economies and 10 bilateral relationships, all anchored to Middle East impact.

The **WRDI panel** on the right shows live risk scores across four dimensions — Political, Military, Economic, and Social — for each country and pair.

What would you like to explore? You can select a country pair from the matrix, or just ask me anything.`,
      timestamp: new Date(),
      analysisType: "general",
    };
    setMessages([welcome]);
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isStreaming) return;

    setInput("");
    setIsStreaming(true);
    setMobileTab("chat");

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
      const detectedPair = detectPairFromQuestion(text);
      if (detectedPair) setSelectedPair(detectedPair.id);

      const allMessages = [...messages, userMsg];

      // Step 1: Run fact-check FIRST (blocking) before streaming
      // This ensures the bot answers with verified/updated data
      setFactCheckStatus({ text: "Searching external sources...", type: "info" });
      let fcResult: any = null;
      let liveKB: LiveKBData | undefined;

      try {
        const fcRes = await fetch("/api/geopol/factcheck", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text }),
        });
        fcResult = await fcRes.json();
      } catch { /* factcheck failed — proceed with static KB */ }

      // Step 2: If KB was updated, fetch fresh snapshot before streaming
      if (fcResult?.status === "kb_updated" && fcResult.kbUpdatesApplied > 0) {
        const fieldsUpdated = fcResult.kbUpdatesApplied;
        setFactCheckStatus({
          text: `Verified — KB updated (${fieldsUpdated} field${fieldsUpdated !== 1 ? "s" : ""}). Answering with updated data...`,
          type: "ok"
        });
        try {
          const kbRes = await fetch("/api/geopol/kb-snapshot");
          if (kbRes.ok) liveKB = await kbRes.json();
        } catch { /* use static KB */ }
      } else if (fcResult?.status === "contradicted") {
        setFactCheckStatus({ text: "Sources contradict this claim — answering with verified data", type: "warn" });
      } else if (fcResult?.status === "verified") {
        setFactCheckStatus({ text: "Claim verified — answering now", type: "ok" });
      } else if (fcResult?.status === "unverified") {
        setFactCheckStatus({ text: "Could not verify externally — answering from KB", type: "info" });
      } else {
        // no_claim or error — clear indicator, answer normally
        setFactCheckStatus(null);
      }

      // Step 3: Stream the answer (with liveKB if KB was updated)
      let content = "";

      // If claim was contradicted, prepend a note before the answer
      if (fcResult?.status === "contradicted") {
        content = `*Note: External sources contradict the claim you mentioned. ${fcResult.summary}*\n\n`;
        setMessages(prev =>
          prev.map(m => m.id === assistantId ? { ...m, content } : m)
        );
      }

      for await (const chunk of streamChatResponse(allMessages, marketData, liveKB)) {
        content += chunk;
        setMessages(prev =>
          prev.map(m => m.id === assistantId ? { ...m, content } : m)
        );
      }

      // If KB was updated, append a note at the end of the answer
      if (fcResult?.status === "kb_updated" && fcResult.kbUpdatesApplied > 0) {
        const fieldsUpdated = fcResult.kbUpdatesApplied;
        const note = `\n\n---\n*Knowledge base updated with verified data (${fieldsUpdated} field${fieldsUpdated !== 1 ? "s" : ""}, ${Math.round(fcResult.confidence * 100)}% confidence). This answer reflects the latest information.*`;
        setMessages(prev =>
          prev.map(m => m.id === assistantId ? { ...m, content: content + note } : m)
        );
      }

      // Clear status after a delay
      setTimeout(() => setFactCheckStatus(null), 5000);

    } catch {
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, content: "**Connection interrupted.** Please retry." }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  }, [input, isStreaming, messages, marketData]);

  const handlePairSelect = useCallback((pairId: string) => {
    setSelectedPair(pairId);
    const brief = generatePairBrief(pairId, marketData);
    sendMessage(brief);
  }, [marketData, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Chat Panel ───────────────────────────────────────────────────────────────
  const ChatPanel = (
    <div className="flex flex-col h-full min-h-0">
      {/* Chat header */}
      <div className="flex items-center justify-between px-3 md:px-4 py-2.5 border-b border-border bg-card/50 flex-shrink-0">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
          <span className="font-bold tracking-tight text-xs md:text-sm text-foreground truncate">INTELLIGENCE CHANNEL</span>
          <span className="font-mono text-xs tracking-wide text-muted-foreground hidden sm:block">
            {lastUpdated ? `UPDATED ${lastUpdated.toLocaleTimeString()}` : "CONNECTING..."}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {factCheckStatus && (
            <span className={`font-mono text-xs flex items-center gap-1 animate-in fade-in duration-300 ${
              factCheckStatus.type === "ok" ? "text-emerald-400" :
              factCheckStatus.type === "warn" ? "text-red-400" : "text-cyan-400"
            }`}>
              <SearchCheck size={10} />
              <span className="hidden sm:inline">{factCheckStatus.text}</span>
            </span>
          )}
          {usingMockData && (
            <span className="font-mono text-xs text-amber-400 flex items-center gap-1">
              <AlertTriangle size={10} />
              <span className="hidden sm:inline">DEMO DATA</span>
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
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-3 md:p-4 space-y-4 overscroll-contain"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`animate-in fade-in slide-in-from-bottom-2 duration-300 ${
              msg.role === "user" ? "flex justify-end" : "flex justify-start"
            }`}
          >
            {msg.role === "assistant" ? (
              <div className="max-w-[95%] md:max-w-[90%] w-full">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span className="font-mono text-xs tracking-wide text-amber-400">GEOPOL-INT</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {msg.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div className="bg-card border border-amber-500/20 rounded-sm p-3 md:p-4">
                  {msg.content ? (
                    <div className="prose prose-invert prose-sm max-w-none
                      prose-headings:font-['Space_Grotesk'] prose-headings:font-bold prose-headings:text-amber-400
                      prose-h2:text-sm md:prose-h2:text-base prose-h2:border-b prose-h2:border-amber-500/20 prose-h2:pb-1 prose-h2:mb-2
                      prose-h3:text-xs md:prose-h3:text-sm prose-h3:text-cyan-400
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
                      <span className="font-mono text-xs text-muted-foreground">PROCESSING...</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="max-w-[85%] md:max-w-[75%]">
                <div className="flex items-center justify-end gap-2 mb-1.5">
                  <span className="font-mono text-xs text-muted-foreground">
                    {msg.timestamp.toLocaleTimeString()}
                  </span>
                  <span className="font-mono text-xs text-cyan-400">ANALYST</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                </div>
                <div className="bg-card border border-cyan-500/20 rounded-sm p-3">
                  <p className="text-sm text-foreground/90 leading-relaxed">{msg.content}</p>
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested questions — only when conversation is fresh */}
      {messages.length <= 2 && (
        <div className="px-3 md:px-4 py-2 border-t border-border/50 flex-shrink-0">
          <p className="font-mono text-xs text-muted-foreground mb-2">SUGGESTED QUERIES:</p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_QUESTIONS.slice(0, 4).map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q)}
                className="text-xs px-2.5 py-1 rounded-sm border border-border hover:border-amber-500/40 hover:text-amber-400 text-muted-foreground transition-all duration-200 flex items-center gap-1 active:scale-95"
              >
                <ChevronRight size={10} />
                {q.length > 45 ? q.substring(0, 45) + "..." : q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="p-3 md:p-4 border-t border-border bg-card/30 flex-shrink-0">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative min-w-0">
            <div className="absolute left-3 top-3 font-mono text-amber-400 text-xs select-none z-10">❯</div>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about geopolitics..."
              className="w-full bg-input border border-border rounded-sm pl-7 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:border-amber-500/50 focus:ring-0 font-mono overflow-hidden"
              style={{ minHeight: "44px", maxHeight: "120px", height: "44px" }}
              rows={1}
              disabled={isStreaming}
            />
          </div>
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isStreaming}
            className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-sm text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 flex-shrink-0 active:scale-95"
            style={{ minWidth: "44px", minHeight: "44px" }}
          >
            <Send size={16} />
          </button>
        </div>
        <p className="font-mono text-xs text-muted-foreground/40 mt-1.5 pl-7 hidden md:block">
          ENTER to send · SHIFT+ENTER for new line · WRDI updates every 5 minutes
        </p>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top ticker bar */}
      <MarketTicker marketData={marketData} loading={marketLoading} />

      {/* ── DESKTOP LAYOUT (md and above) ───────────────────────────────────── */}
      <div className="hidden md:flex flex-1 overflow-hidden">

        {/* Left sidebar — country navigator */}
        <CountrySidebar
          countries={COUNTRIES}
          marketData={marketData}
          onCountrySelect={(countryId: string) => {
            const country = COUNTRIES.find(c => c.id === countryId);
            if (country) {
              sendMessage(`Quick read on ${country.name} — what's the most important geopolitical signal right now?`);
            }
          }}
        />

        {/* Center — chat */}
        <div className="flex-1 flex flex-col min-w-0 border-x border-border overflow-hidden">
          {ChatPanel}
        </div>

        {/* Right panel — WRDI + supporting panels */}
        <div className="w-80 flex flex-col border-l border-border overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-border flex-shrink-0">
            {[
              { id: "wrdi",      label: "WRDI",      icon: Activity },
              { id: "matrix",    label: "MATRIX",    icon: Globe },
              { id: "market",    label: "MARKETS",   icon: Zap },
              { id: "scenarios", label: "RISKS",     icon: AlertTriangle },
              { id: "pipeline",  label: "PIPELINE",  icon: Cpu },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveRightPanel(id as typeof activeRightPanel)}
                className={`flex-1 flex items-center justify-center gap-1 py-2 font-mono text-[10px] transition-all duration-200 ${
                  activeRightPanel === id
                    ? "text-amber-400 border-b-2 border-amber-400 bg-amber-500/5"
                    : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"
                }`}
              >
                <Icon size={10} />
                {label}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {activeRightPanel === "wrdi" && (
              <WRDIPanel
                marketData={marketData}
                selectedPair={selectedPair}
                loading={marketLoading}
              />
            )}
            {activeRightPanel === "matrix" && (
              <div className="flex-1 overflow-y-auto">
                <RelationshipMatrix
                  pairs={COUNTRY_PAIRS}
                  countries={COUNTRIES}
                  selectedPair={selectedPair}
                  onPairSelect={handlePairSelect}
                />
              </div>
            )}
            {activeRightPanel === "market" && (
              <div className="flex-1 overflow-y-auto">
                <MarketPanel
                  marketData={marketData}
                  countries={COUNTRIES}
                  loading={marketLoading}
                />
              </div>
            )}
            {activeRightPanel === "scenarios" && (
              <div className="flex-1 overflow-y-auto">
                <ScenarioPanel
                  scenarios={MIDDLE_EAST_SCENARIOS}
                  onScenarioSelect={(scenario: MiddleEastScenario) => {
                    sendMessage(`What's the current status of the "${scenario.title}" scenario? Is it getting more or less likely based on today's market signals?`);
                  }}
                />
              </div>
            )}
            {activeRightPanel === "pipeline" && (
              <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                <PipelinePanel />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MOBILE LAYOUT (below md) ────────────────────────────────────────── */}
      <div className="flex md:hidden flex-1 flex-col overflow-hidden">

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">

          {/* CHAT tab */}
          {mobileTab === "chat" && (
            <div className="flex flex-col h-full min-h-0 overflow-hidden">
              {ChatPanel}
            </div>
          )}

          {/* ACTORS tab */}
          {mobileTab === "countries" && (
            <div className="flex-1 overflow-y-auto">
              <div className="p-3 border-b border-border bg-card/50">
                <span className="font-mono text-xs text-amber-400 tracking-wide">MONITORED ACTORS</span>
              </div>
              <div className="p-3 space-y-2">
                {COUNTRIES.map((country) => {
                  const countryMarket = marketData.find(d => d.country === country.id && d.type === "index");
                  const change = countryMarket?.changePercent ?? null;
                  return (
                    <button
                      key={country.id}
                      onClick={() => {
                        sendMessage(`Quick read on ${country.name} — what's the most important geopolitical signal right now?`);
                        setMobileTab("chat");
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-sm border border-border hover:border-amber-500/40 bg-card/30 hover:bg-card/60 transition-all duration-200 active:scale-[0.98]"
                    >
                      <span className="text-2xl">{country.flag}</span>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-sm text-foreground">{country.name}</div>
                        <div className="font-mono text-xs text-muted-foreground truncate">
                          {country.economicPillars[0]}
                        </div>
                      </div>
                      {change !== null && (
                        <span className={`font-mono text-xs font-bold ${change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {change >= 0 ? "+" : ""}{change.toFixed(2)}%
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* MATRIX tab */}
          {mobileTab === "matrix" && (
            <div className="flex-1 overflow-y-auto">
              <div className="p-3 border-b border-border bg-card/50">
                <span className="font-mono text-xs text-amber-400 tracking-wide">RELATIONSHIP MATRIX</span>
              </div>
              <RelationshipMatrix
                pairs={COUNTRY_PAIRS}
                countries={COUNTRIES}
                selectedPair={selectedPair}
                onPairSelect={(pairId) => {
                  handlePairSelect(pairId);
                  setMobileTab("chat");
                }}
              />
            </div>
          )}

          {/* WRDI tab */}
          {mobileTab === "wrdi" && (
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <WRDIPanel
                marketData={marketData}
                selectedPair={selectedPair}
                loading={marketLoading}
              />
            </div>
          )}

          {/* MARKETS tab */}
          {mobileTab === "market" && (
            <div className="flex-1 overflow-y-auto">
              <div className="p-3 border-b border-border bg-card/50 flex items-center justify-between">
                <span className="font-mono text-xs text-amber-400 tracking-wide">LIVE MARKETS</span>
                <button onClick={refresh} className="text-muted-foreground hover:text-amber-400 p-1">
                  <RefreshCw size={12} className={marketLoading ? "animate-spin" : ""} />
                </button>
              </div>
              <MarketPanel
                marketData={marketData}
                countries={COUNTRIES}
                loading={marketLoading}
              />
            </div>
          )}
        </div>

        {/* Mobile bottom navigation */}
        <div className="flex-shrink-0 border-t border-border bg-card/80 backdrop-blur-sm">
          <div className="flex">
            {[
              { id: "chat",      label: "CHAT",    icon: MessageSquare },
              { id: "countries", label: "ACTORS",  icon: Map },
              { id: "matrix",    label: "MATRIX",  icon: Globe },
              { id: "wrdi",      label: "WRDI",    icon: Activity },
              { id: "market",    label: "MARKETS", icon: BarChart2 },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setMobileTab(id as typeof mobileTab)}
                className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-all duration-200 relative ${
                  mobileTab === id ? "text-amber-400" : "text-muted-foreground"
                }`}
                style={{ minHeight: "56px" }}
              >
                <Icon size={18} />
                <span className="font-mono text-[9px] tracking-wide leading-none">{label}</span>
                {mobileTab === id && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-amber-400 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
