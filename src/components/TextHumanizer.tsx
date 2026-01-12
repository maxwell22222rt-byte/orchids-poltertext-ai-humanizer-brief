"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Ghost, Copy, Download, Loader2, Sparkles, RefreshCw, History as HistoryIcon, Clock, ChevronRight, Wand2, AlertCircle, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const TONES = [
  { value: "academic", label: "Academic" },
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "creative", label: "Creative" },
];

const READABILITY_LEVELS = [
  { value: "high-school", label: "High School" },
  { value: "college", label: "College" },
  { value: "natural", label: "Natural Human" },
];

const MODELS = [
  { 
    value: "ghost-mini", 
    label: "Ghost Mini", 
    description: "Fast & Efficient",
    speed: "2-5 sec",
    info: "Lightning fast with GPT-4o-mini. Perfect for quick edits and short content."
  },
  { 
    value: "ghost-pro", 
    label: "Ghost Pro", 
    description: "Balanced Quality",
    speed: "5-10 sec",
    info: "Optimal speed/quality balance with GPT-4o. Great for professional content."
  },
  { 
    value: "king", 
    label: "King", 
    description: "Maximum Quality",
    speed: "10-30 sec",
    info: "Premium quality with advanced processing. Research-grade humanization up to 10k words."
  },
] as const;

// Debug: Log models on load
if (typeof window !== 'undefined') {
  console.log('🔍 MODELS Array:', MODELS.map(m => m.value));
}

const PROMPT_STYLES = [
  { 
    value: "default", 
    label: "Default", 
    description: "Full humanization",
    info: "Complete discourse-level transformation with all enhancements"
  },
  { 
    value: "quick", 
    label: "Quick", 
    description: "Fast processing",
    info: "Streamlined processing for faster results"
  },
  { 
    value: "polish", 
    label: "Polish", 
    description: "Refine & improve",
    info: "Focus on flow and structure improvement"
  },
];

interface HistoryItem {
  id: string;
  original_text: string;
  humanized_text: string;
  tone: string;
  readability: string;
  word_count: number;
  created_at: string;
}

export function TextHumanizer() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [tone, setTone] = useState("professional");
  const [readability, setReadability] = useState("natural");
  const [model, setModel] = useState("ghost-pro");
  const [promptStyle, setPromptStyle] = useState("default");
  const [mode, setMode] = useState<"humanize" | "paraphrase">("humanize");
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [activeTab, setActiveTab] = useState("editor");
    const [warning, setWarning] = useState<string | null>(null);
  const outputTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize output textarea
  useEffect(() => {
    if (outputTextareaRef.current) {
      outputTextareaRef.current.style.height = 'auto';
      outputTextareaRef.current.style.height = Math.max(400, outputTextareaRef.current.scrollHeight) + 'px';
    }
  }, [outputText]);

    const inputWordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;

  const outputWordCount = outputText.trim() ? outputText.trim().split(/\s+/).length : 0;
  const maxWords = model === "king" ? 10000 : 5000;
  const isOverLimit = inputWordCount > maxWords;
  
  // Get current model info
  const selectedModel = MODELS.find(m => m.value === model);
  const selectedPromptStyle = PROMPT_STYLES.find(p => p.value === promptStyle);
  
  // Calculate estimated processing time
  const estimatedTime = (() => {
    if (inputWordCount === 0) return "0 sec";
    
    if (model === "ghost-mini") {
      return inputWordCount < 1000 ? "2-3 sec" : "3-5 sec";
    } else if (model === "ghost-pro") {
      return inputWordCount < 1000 ? "5-7 sec" : "7-10 sec";
    } else { // king
      if (promptStyle === "quick") {
        return inputWordCount < 2000 ? "8-10 sec" : "10-15 sec";
      } else if (promptStyle === "polish") {
        return inputWordCount < 2000 ? "10-12 sec" : "12-18 sec";
      } else { // default
        if (inputWordCount < 1000) return "12-15 sec";
        if (inputWordCount < 3000) return "15-20 sec";
        if (inputWordCount < 6000) return "20-28 sec";
        return "28-35 sec";
      }
    }
  })();

  const fetchHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch("/api/history");
      const data = await response.json();
      if (data.history) {
        setHistory(data.history);
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    }
  }, [activeTab, fetchHistory]);

  const handleProcess = useCallback(async () => {
    if (!inputText.trim() || isOverLimit) return;

    setIsProcessing(true);
    setOutputText("");

    const endpoint = mode === "humanize" ? "/api/humanize" : "/api/paraphrase";

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: inputText, tone, readability, model, promptStyle }),
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to ${mode} text`);
        }
  
        const data = await response.json();
        setOutputText(data.humanizedText);
        setWarning(data.warning);
      } catch (error: any) {

      console.error("Error:", error);
      setOutputText(`An error occurred: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [inputText, tone, readability, model, promptStyle, mode, isOverLimit]);

  const handleCopy = useCallback(async () => {
    if (!outputText) return;
    await navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [outputText]);

  const handleDownload = useCallback(() => {
    if (!outputText) return;
    const blob = new Blob([outputText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${mode}d-text.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [outputText, mode]);

  const handleClear = useCallback(() => {
    setInputText("");
    setOutputText("");
  }, []);

  const loadFromHistory = (item: HistoryItem) => {
    setInputText(item.original_text);
    setOutputText(item.humanized_text);
    setTone(item.tone);
    setReadability(item.readability);
    setActiveTab("editor");
  };

  return (
    <TooltipProvider>
      <div className="w-full max-w-6xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <TabsList className="bg-card/50 border border-border/30 p-1 h-11">
            <TabsTrigger value="editor" className="flex items-center gap-2 px-6 h-9 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Sparkles className="w-4 h-4" />
              <span className="font-medium">Editor</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2 px-6 h-9 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <HistoryIcon className="w-4 h-4" />
              <span className="font-medium">History</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-1 p-1 bg-card/50 border border-border/30 rounded-lg h-11">
            <Button
              variant={mode === "humanize" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setMode("humanize")}
              className="text-sm h-9 px-4 font-medium"
            >
              Humanize
            </Button>
            <Button
              variant={mode === "paraphrase" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setMode("paraphrase")}
              className="text-sm h-9 px-4 font-medium"
            >
              Paraphrase
            </Button>
          </div>
        </div>

          <TabsContent value="editor" className="mt-0">
            {/* Processing Info Banner */}
            {inputWordCount > 0 && !isOverLimit && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center gap-3 text-sm"
              >
                <Info className="w-4 h-4 text-primary shrink-0" />
                <div className="flex-1">
                  <p className="text-foreground">
                    <span className="font-semibold">{selectedModel?.label}</span>
                    {model === "king" && ` (${selectedPromptStyle?.label} style)`} · 
                    Estimated time: <span className="font-mono font-semibold text-primary">{estimatedTime}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Powered by pre-trained AI on high-performance GPUs. Pattern transformation, not manual rewriting.
                  </p>
                </div>
              </motion.div>
            )}
            
            {warning && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-3 text-amber-500 text-sm"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p>{warning}</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-auto h-7 text-xs hover:bg-amber-500/20"
                  onClick={() => setWarning(null)}
                >
                  Dismiss
                </Button>
              </motion.div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  Input Text
                  {isOverLimit && (
                    <Badge variant="destructive" className="h-5 text-[10px] animate-pulse">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Over Limit
                    </Badge>
                  )}
                </label>
                <span className={`text-xs font-mono ${isOverLimit ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                  {inputWordCount.toLocaleString()} / {maxWords.toLocaleString()} words
                </span>
              </div>
              <div className="relative group">
                <Textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Paste your AI-generated text here (up to ${maxWords.toLocaleString()} words)...`}
                  className={`min-h-[300px] sm:min-h-[400px] resize-none bg-card/50 border-border/50 focus:border-primary/50 transition-all duration-300 text-[15px] leading-relaxed placeholder:text-muted-foreground/50 font-serif ${isOverLimit ? "border-destructive/50 ring-2 ring-destructive/20" : ""}`}
                />
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 to-transparent rounded-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-foreground">
                  {mode === "humanize" ? "Humanized" : "Paraphrased"} Output
                </label>
                <span className="text-xs text-muted-foreground font-mono">
                  {outputWordCount.toLocaleString()} words
                </span>
              </div>
              <div className="relative group">
                <Textarea
                  ref={outputTextareaRef}
                  value={outputText}
                  readOnly
                  placeholder={`Your ${mode}d text will appear here...`}
                  className="min-h-[400px] resize-none bg-card/50 border-border/50 text-base leading-relaxed placeholder:text-muted-foreground/50 font-serif overflow-hidden"
                />
                <AnimatePresence>
                  {isProcessing && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center bg-card/90 backdrop-blur-sm rounded-lg z-10"
                    >
                      <div className="flex flex-col items-center gap-4 p-6">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <Ghost className="w-10 h-10 text-primary" />
                        </motion.div>
                        <div className="text-center space-y-1">
                          <span className="text-base font-semibold text-foreground block">
                            {mode === "humanize" ? "Humanizing Your Text..." : "Rewriting Structure..."}
                          </span>
                          <span className="text-sm text-muted-foreground block">
                            {selectedModel?.label} · Est. {estimatedTime}
                          </span>
                          <span className="text-xs text-muted-foreground/70 block">
                            GPU-Accelerated Processing
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 to-transparent rounded-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 sm:p-4 bg-card/30 rounded-xl border border-border/30 shadow-sm">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 flex-1 w-full">
              <div className="flex items-center gap-2 flex-1 min-w-[140px]">
                <label className="text-xs font-medium text-foreground whitespace-nowrap">Model</label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger className="w-full sm:w-[160px] h-9 text-sm bg-card/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODELS.map((m) => {
                      console.log('🔍 Rendering model option:', m.value, m.label);
                      return (
                        <SelectItem key={m.value} value={m.value}>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{m.label}</span>
                              <span className="text-xs text-muted-foreground">⚡ {m.speed}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{m.description}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-semibold mb-1">{selectedModel?.label}</p>
                    <p className="text-xs">{selectedModel?.info}</p>
                    <p className="text-xs mt-1 text-muted-foreground">Speed: {selectedModel?.speed}</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="flex items-center gap-2 flex-1 min-w-[120px]">
                <label className="text-xs font-medium text-foreground whitespace-nowrap">Tone</label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger className="w-full sm:w-[140px] h-9 text-sm bg-card/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TONES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 flex-1 min-w-[130px]">
                <label className="text-xs font-medium text-foreground whitespace-nowrap">Level</label>
                <Select value={readability} onValueChange={setReadability}>
                  <SelectTrigger className="w-full sm:w-[150px] h-9 text-sm bg-card/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {READABILITY_LEVELS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {model === "king" && (
                <div className="flex items-center gap-2 flex-1 min-w-[130px]">
                  <label className="text-xs font-medium text-foreground whitespace-nowrap">Style</label>
                  <Select value={promptStyle} onValueChange={setPromptStyle}>
                    <SelectTrigger className="w-full sm:w-[150px] h-9 text-sm bg-card/50 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROMPT_STYLES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{p.label}</span>
                            <span className="text-xs text-muted-foreground">{p.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-border/30 pt-3 sm:pt-0 sm:pl-4 sm:ml-2">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClear}
                      disabled={!inputText && !outputText}
                      className="text-muted-foreground hover:text-foreground h-9 w-9 sm:w-auto sm:px-3 p-0 sm:p-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Clear All</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopy}
                      disabled={!outputText}
                      className="text-muted-foreground hover:text-foreground h-9 px-2 sm:px-3"
                    >
                      <Copy className="w-4 h-4" />
                      {copied && <span className="ml-1 text-xs text-primary font-medium hidden sm:inline">Copied!</span>}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy to Clipboard</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDownload}
                      disabled={!outputText}
                      className="text-muted-foreground hover:text-foreground h-9 w-9 sm:w-auto sm:px-3 p-0 sm:p-2"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Download Text</TooltipContent>
                </Tooltip>
              </div>

              <Button
                onClick={handleProcess}
                disabled={!inputText.trim() || isProcessing || isOverLimit}
                className="flex-1 sm:flex-initial sm:ml-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all duration-300 h-10 px-4 sm:px-6 font-medium text-sm"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span className="hidden sm:inline">Processing</span>
                    <span className="sm:hidden">Wait...</span>
                  </>
                ) : mode === "humanize" ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Humanize
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Paraphrase
                  </>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-0">
          <div className="bg-card/30 border border-border/30 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border/30 flex items-center justify-between bg-card/50">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Recent Activity
              </h3>
              <Button variant="ghost" size="sm" onClick={fetchHistory} disabled={isLoadingHistory}>
                <RefreshCw className={`w-4 h-4 ${isLoadingHistory ? "animate-spin" : ""}`} />
              </Button>
            </div>
            <div className="divide-y divide-border/30 max-h-[600px] overflow-y-auto">
              {isLoadingHistory ? (
                <div className="p-12 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading history...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="p-20 text-center">
                  <Ghost className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                  <p className="text-muted-foreground">No history yet. Start creating!</p>
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 hover:bg-primary/5 transition-colors cursor-pointer group"
                    onClick={() => loadFromHistory(item)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline" className="text-[10px] font-medium border-primary/30 text-primary">
                            {item.tone}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] font-medium border-border/50">
                            {item.readability}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground font-serif line-clamp-2 mb-2">
                          "{item.original_text.slice(0, 150)}..."
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            {item.word_count} words
                          </span>
                          <span className="flex items-center gap-1.5 text-primary/70">
                            <ChevronRight className="w-3 h-3" />
                            Click to restore
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors self-center" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
    </TooltipProvider>
  );
}
