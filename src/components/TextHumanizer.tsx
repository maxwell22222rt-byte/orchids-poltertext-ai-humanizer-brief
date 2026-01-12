"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Ghost, Copy, Download, Loader2, Sparkles, RefreshCw, History as HistoryIcon, Clock, ChevronRight, Wand2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

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
  const [mode, setMode] = useState<"humanize" | "paraphrase">("humanize");
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [activeTab, setActiveTab] = useState("editor");
    const [warning, setWarning] = useState<string | null>(null);

    const inputWordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;

  const outputWordCount = outputText.trim() ? outputText.trim().split(/\s+/).length : 0;
  const isOverLimit = inputWordCount > 5000;

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
          body: JSON.stringify({ text: inputText, tone, readability }),
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
  }, [inputText, tone, readability, mode, isOverLimit]);

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
    <div className="w-full max-w-6xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
          <TabsList className="bg-card/50 border border-border/30 p-1">
            <TabsTrigger value="editor" className="flex items-center gap-2 px-6">
              <Sparkles className="w-4 h-4" />
              Editor
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2 px-6">
              <HistoryIcon className="w-4 h-4" />
              History
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 p-1 bg-card/50 border border-border/30 rounded-lg">
            <Button
              variant={mode === "humanize" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setMode("humanize")}
              className="text-xs h-8"
            >
              Humanize
            </Button>
            <Button
              variant={mode === "paraphrase" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setMode("paraphrase")}
              className="text-xs h-8"
            >
              Paraphrase
            </Button>
          </div>
        </div>

          <TabsContent value="editor" className="mt-0">
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
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  Input Text
                  {isOverLimit && (
                    <Badge variant="destructive" className="h-5 text-[10px] animate-pulse">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Over 5,000 words limit
                    </Badge>
                  )}
                </label>
                <span className={`text-xs font-mono ${isOverLimit ? "text-destructive" : "text-muted-foreground"}`}>
                  {inputWordCount.toLocaleString()} / 5,000 words
                </span>
              </div>
              <div className="relative group">
                <Textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste your AI-generated text here (up to 5,000 words)..."
                  className={`min-h-[400px] resize-none bg-card/50 border-border/50 focus:border-primary/50 transition-all duration-300 text-base leading-relaxed placeholder:text-muted-foreground/50 font-serif ${isOverLimit ? "border-destructive/50 ring-1 ring-destructive/20" : ""}`}
                />
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 to-transparent rounded-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  {mode === "humanize" ? "Humanized" : "Paraphrased"} Output
                </label>
                <span className="text-xs text-muted-foreground font-mono">
                  {outputWordCount.toLocaleString()} words
                </span>
              </div>
              <div className="relative group">
                <Textarea
                  value={outputText}
                  readOnly
                  placeholder={`Your ${mode}d text will appear here...`}
                  className="min-h-[400px] resize-none bg-card/50 border-border/50 text-base leading-relaxed placeholder:text-muted-foreground/50 font-serif"
                />
                <AnimatePresence>
                  {isProcessing && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center bg-card/80 backdrop-blur-sm rounded-lg"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <Ghost className="w-8 h-8 text-primary" />
                        </motion.div>
                        <span className="text-sm text-muted-foreground">
                          {mode === "humanize" ? "Haunting your text..." : "Rewriting structure..."}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 to-transparent rounded-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-card/30 rounded-xl border border-border/30 shadow-sm">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground uppercase tracking-wider whitespace-nowrap">Tone</label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger className="w-[140px] h-9 text-sm bg-card/50 border-border/50">
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

              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground uppercase tracking-wider whitespace-nowrap">Level</label>
                <Select value={readability} onValueChange={setReadability}>
                  <SelectTrigger className="w-[150px] h-9 text-sm bg-card/50 border-border/50">
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
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                disabled={!inputText && !outputText}
                className="text-muted-foreground hover:text-foreground h-9"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                disabled={!outputText}
                className="text-muted-foreground hover:text-foreground h-9"
              >
                <Copy className="w-4 h-4" />
                {copied && <span className="ml-1 text-xs text-primary">Copied!</span>}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                disabled={!outputText}
                className="text-muted-foreground hover:text-foreground h-9"
              >
                <Download className="w-4 h-4" />
              </Button>

              <Button
                onClick={handleProcess}
                disabled={!inputText.trim() || isProcessing || isOverLimit}
                className="ml-auto sm:ml-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all duration-300 h-9"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Processing
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
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
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
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                            {item.tone} • {item.readability}
                          </span>
                          <span className="text-[10px] text-muted-foreground uppercase">
                            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-foreground font-serif line-clamp-2 italic mb-2 text-muted-foreground/80">
                          "{item.original_text.slice(0, 150)}..."
                        </p>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                          <span className="flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-primary/40" />
                            {item.word_count} words
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-primary/40" />
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
  );
}
