"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search as SearchIcon,
  Loader2,
  Brain,
  Zap,
  Sparkles,
  Layers,
  MessageSquare,
  User,
  Clock,
  Activity,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { searchMemories } from "@/lib/api";
import type { SearchResult, RetrieveMethod } from "@/lib/api";

const RETRIEVE_METHODS: {
  value: RetrieveMethod;
  label: string;
  desc: string;
  icon: typeof Zap;
}[] = [
  { value: "keyword", label: "Quick", desc: "<100ms", icon: Zap },
  { value: "hybrid", label: "Smart", desc: "~300ms", icon: Sparkles },
  { value: "agentic", label: "Deep", desc: "2-5s", icon: Layers },
];

const MEMORY_TYPE_STYLES: Record<
  string,
  { label: string; className: string; icon: typeof MessageSquare }
> = {
  episodic_memory: {
    label: "Episode",
    className: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    icon: MessageSquare,
  },
  profile: {
    label: "Profile",
    className: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    icon: User,
  },
  foresight: {
    label: "Foresight",
    className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    icon: Clock,
  },
  event_log: {
    label: "Event",
    className: "bg-green-500/20 text-green-400 border-green-500/30",
    icon: Activity,
  },
};

function MemoryTypeBadge({ type }: { type: string }) {
  const style = MEMORY_TYPE_STYLES[type] || {
    label: type,
    className: "bg-muted text-muted-foreground border-border",
    icon: Brain,
  };
  const Icon = style.icon;
  return (
    <Badge variant="outline" className={style.className}>
      <Icon className="mr-1 h-3 w-3" />
      {style.label}
    </Badge>
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [contact, setContact] = useState("");
  const [retrieveMethod, setRetrieveMethod] =
    useState<RetrieveMethod>("hybrid");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    setError("");
    setSearched(true);

    try {
      const data = await searchMemories(
        query.trim(),
        contact.trim() || undefined,
        { retrieve_method: retrieveMethod },
      );
      setResults(data);
    } catch {
      setError("Search failed. Is the backend running?");
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="font-display text-3xl text-foreground">Search Memory</h1>
        <p className="mt-1 mb-6 text-muted-foreground">
          Search across all meeting memories stored in EverOS.
        </p>
      </motion.div>

      {/* Search form */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="mb-6">
          <CardContent className="p-5">
            <form onSubmit={handleSearch} className="space-y-3">
              <div className="flex gap-3">
                <Input
                  placeholder="Search memories... (e.g. 'budget discussion')"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Filter by contact"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-48"
                />
                <Button type="submit" disabled={searching || !query.trim()}>
                  {searching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <SearchIcon className="h-4 w-4" />
                  )}
                  Search
                </Button>
              </div>

              {/* Retrieval method selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Retrieval:
                </span>
                {RETRIEVE_METHODS.map((m) => {
                  const Icon = m.icon;
                  const active = retrieveMethod === m.value;
                  return (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setRetrieveMethod(m.value)}
                      className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors ${
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-3 w-3" />
                      {m.label}
                      <span className="text-[10px] opacity-60">{m.desc}</span>
                    </button>
                  );
                })}
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      {searching && retrieveMethod === "agentic" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 flex items-center gap-2 text-sm text-muted-foreground"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          Searching deeply with agentic retrieval...
        </motion.div>
      )}

      {searched && !searching && results.length === 0 && !error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3 py-12 text-center"
        >
          <Brain className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-muted-foreground">
            No memories found for &quot;{query}&quot;
          </p>
        </motion.div>
      )}

      {results.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <p className="mb-3 text-sm text-muted-foreground">
            {results.length} result{results.length !== 1 ? "s" : ""} found
          </p>
          <div className="space-y-3">
            {results.map((result, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <MemoryTypeBadge type={result.memory_type} />
                      <span className="text-xs text-muted-foreground">
                        {result.meeting_title}
                      </span>
                      {result.meeting_date && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(result.meeting_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground">{result.content}</p>
                    {result.participants.length > 0 && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Participants: {result.participants.join(", ")}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
