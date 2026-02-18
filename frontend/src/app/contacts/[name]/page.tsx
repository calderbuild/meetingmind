"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Brain,
  CheckSquare,
  Clock,
  FileText,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getMeetingsByParticipant, getCommitments } from "@/lib/api";
import type { Meeting, Commitment } from "@/lib/api";

export default function ContactTimelinePage() {
  const { name } = useParams<{ name: string }>();
  const contactName = decodeURIComponent(name || "");
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function loadData() {
    if (!contactName) return;
    setLoading(true);
    setError("");
    Promise.all([
      getMeetingsByParticipant(contactName),
      getCommitments({ contact: contactName }),
    ])
      .then(([m, c]) => {
        setMeetings(m);
        setCommitments(c);
      })
      .catch(() => setError("Failed to load contact data."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, [contactName]);

  const pendingCommitments = commitments.filter(
    (c) => c.status === "pending" || c.status === "overdue"
  );
  const completedCommitments = commitments.filter(
    (c) => c.status === "completed"
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
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
        <Link href="/contacts">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4" /> Contacts
          </Button>
        </Link>

        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
              {contactName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="font-display text-3xl text-foreground">
                {contactName}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {meetings.length} meeting{meetings.length !== 1 ? "s" : ""} recorded
              </p>
            </div>
          </div>
          <Link href={`/briefings/${encodeURIComponent(contactName)}`}>
            <Button>
              <FileText className="h-4 w-4" /> Generate Briefing
            </Button>
          </Link>
        </div>
      </motion.div>

      {error && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <p className="flex-1 text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </Button>
        </div>
      )}

      <div className="space-y-6">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-3 gap-4"
        >
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Brain className="h-5 w-5 text-primary" />
              <div>
                <p className="text-lg font-semibold">{meetings.length}</p>
                <p className="text-xs text-muted-foreground">Meetings</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <CheckSquare className="h-5 w-5 text-warning" />
              <div>
                <p className="text-lg font-semibold">
                  {pendingCommitments.length}
                </p>
                <p className="text-xs text-muted-foreground">Open</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <CheckSquare className="h-5 w-5 text-success" />
              <div>
                <p className="text-lg font-semibold">
                  {completedCommitments.length}
                </p>
                <p className="text-xs text-muted-foreground">Done</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Open Commitments */}
        {pendingCommitments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Open Commitments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingCommitments.map((c) => (
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
                        c.status === "overdue" ? "destructive" : "warning"
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

        {/* Meeting Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Meeting Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {meetings.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No meetings recorded with {contactName}.
                </p>
              ) : (
                <div className="relative space-y-0">
                  {meetings.map((meeting, i) => (
                    <div key={meeting.id} className="relative flex gap-4">
                      {/* Timeline line */}
                      <div className="flex flex-col items-center">
                        <div className="mt-1.5 h-3 w-3 rounded-full border-2 border-primary bg-background" />
                        {i < meetings.length - 1 && (
                          <div className="w-px flex-1 bg-border" />
                        )}
                      </div>
                      {/* Content */}
                      <Link
                        href={`/meetings/${meeting.id}`}
                        className="mb-4 flex-1 rounded-md p-3 transition-colors hover:bg-accent"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {meeting.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(
                                meeting.meeting_date
                              ).toLocaleDateString()}{" "}
                              - {meeting.participants.join(", ")}
                            </p>
                            {meeting.summary && (
                              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                                {meeting.summary}
                              </p>
                            )}
                          </div>
                          <ArrowRight className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
