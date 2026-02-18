"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Check, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCommitments, updateCommitment } from "@/lib/api";
import type { Commitment } from "@/lib/api";

export default function CommitmentsPage() {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "completed" | "overdue">("all");

  function loadCommitments() {
    setLoading(true);
    setError("");
    getCommitments()
      .then(setCommitments)
      .catch(() => setError("Failed to load commitments."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadCommitments();
  }, []);

  async function handleComplete(id: string) {
    try {
      const updated = await updateCommitment(id, { status: "completed" });
      setCommitments((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch {
      setError("Failed to update commitment.");
    }
  }

  const filtered =
    filter === "all"
      ? commitments
      : commitments.filter((c) => c.status === filter);

  return (
    <div className="mx-auto max-w-3xl p-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="font-display text-3xl text-foreground">Commitments</h1>
        <p className="mt-1 mb-6 text-muted-foreground">
          Track what you owe others and what others owe you.
        </p>
      </motion.div>

      {error && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <p className="flex-1 text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={loadCommitments}>
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </Button>
        </div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-4 flex gap-2"
      >
        {(["all", "pending", "completed", "overdue"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>
              {filtered.length} commitment{filtered.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No commitments found.
              </p>
            ) : (
              <div className="space-y-3">
                {filtered.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-start justify-between rounded-md border border-border p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {c.description}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge
                          variant={c.direction === "i_owe" ? "warning" : "default"}
                          className="text-[10px]"
                        >
                          {c.direction === "i_owe" ? "You owe" : "Owed to you"}
                        </Badge>
                        <span>
                          {c.direction === "i_owe" ? c.recipient : c.owner}
                        </span>
                        {c.due_date && (
                          <span>Due: {new Date(c.due_date).toLocaleDateString()}</span>
                        )}
                        <span className="text-muted-foreground/60">
                          from: {c.meeting_title}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 flex items-center gap-2">
                      <Badge
                        variant={
                          c.status === "completed"
                            ? "success"
                            : c.status === "overdue"
                              ? "destructive"
                              : "warning"
                        }
                      >
                        {c.status}
                      </Badge>
                      {c.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Mark complete"
                          onClick={() => handleComplete(c.id)}
                        >
                          <Check className="h-3.5 w-3.5 text-success" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
