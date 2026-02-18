"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Brain,
  CheckSquare,
  Clock,
  FileText,
  Loader2,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getMeeting, getCommitments } from "@/lib/api";
import type { Meeting, Commitment } from "@/lib/api";

export default function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    Promise.all([getMeeting(id), getCommitments()])
      .then(([m, allC]) => {
        setMeeting(m);
        setCommitments(allC.filter((c) => c.meeting_id === id));
      })
      .catch(() => setError("Failed to load meeting."))
      .finally(() => setLoading(false));
  }, [id]);

  // Poll while processing
  useEffect(() => {
    if (!meeting || meeting.status !== "processing") return;
    const interval = setInterval(async () => {
      try {
        const updated = await getMeeting(id);
        setMeeting(updated);
        if (updated.status !== "processing") {
          const allC = await getCommitments();
          setCommitments(allC.filter((c) => c.meeting_id === id));
          clearInterval(interval);
        }
      } catch {
        // ignore polling errors
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [meeting?.status, id]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="p-8">
        <p className="text-destructive">{error || "Meeting not found."}</p>
        <Link href="/">
          <Button variant="ghost" className="mt-4">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </Link>

        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl text-foreground">
              {meeting.title}
            </h1>
            <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {new Date(meeting.meeting_date).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {meeting.participants.join(", ")}
              </span>
            </div>
          </div>
          <Badge
            variant={
              meeting.status === "completed"
                ? "success"
                : meeting.status === "processing"
                  ? "warning"
                  : "destructive"
            }
          >
            {meeting.status === "processing" && (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            )}
            {meeting.status}
          </Badge>
        </div>
      </motion.div>

      <div className="space-y-6">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-2 gap-4"
        >
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Brain className="h-5 w-5 text-primary" />
              <div>
                <p className="text-lg font-semibold">
                  {meeting.status === "completed" ? "Stored" : "--"}
                </p>
                <p className="text-xs text-muted-foreground">Memories</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <CheckSquare className="h-5 w-5 text-warning" />
              <div>
                <p className="text-lg font-semibold">{commitments.length}</p>
                <p className="text-xs text-muted-foreground">Commitments found</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Summary */}
        {meeting.summary && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.12 }}
          >
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-primary mb-1">AI Summary</p>
                <p className="text-sm text-foreground leading-relaxed">
                  {meeting.summary}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Commitments */}
        {commitments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Commitments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {commitments.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-start justify-between rounded-md border border-border p-3"
                  >
                    <div>
                      <p className="text-sm text-foreground">{c.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.direction === "i_owe"
                          ? `You owe ${c.recipient}`
                          : `${c.owner} owes you`}
                        {c.due_date &&
                          ` - due ${new Date(c.due_date).toLocaleDateString()}`}
                      </p>
                    </div>
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
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Transcript */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Meeting Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-mono leading-relaxed">
                {meeting.notes}
              </pre>
            </CardContent>
          </Card>
        </motion.div>

        {/* Briefing link */}
        {meeting.status === "completed" && meeting.participants.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <Separator />
            <div className="mt-4">
              <p className="mb-3 text-sm text-muted-foreground">
                Generate a briefing for a participant:
              </p>
              <div className="flex flex-wrap gap-2">
                {meeting.participants.map((p) => (
                  <Link key={p} href={`/briefings/${encodeURIComponent(p)}`}>
                    <Button variant="outline" size="sm">
                      Briefing: {p}
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
