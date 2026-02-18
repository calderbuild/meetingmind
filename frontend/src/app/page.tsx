"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, Plus, ArrowRight, Brain, CheckSquare, RefreshCw, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getMeetings, getCommitments } from "@/lib/api";
import type { Meeting, Commitment } from "@/lib/api";

export default function Dashboard() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function loadData() {
    setLoading(true);
    setError("");
    Promise.all([getMeetings(), getCommitments()])
      .then(([m, c]) => {
        setMeetings(m);
        setCommitments(c);
      })
      .catch(() => setError("Failed to load data. Is the backend running?"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  const pendingCommitments = commitments.filter((c) => c.status === "pending");
  const recentMeetings = meetings.slice(0, 5);
  const uniqueContacts = [
    ...new Set(meetings.flatMap((m) => m.participants)),
  ];

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="font-display text-3xl text-foreground">
              Meeting Memory
            </h1>
            <p className="mt-1 text-muted-foreground">
              Never forget a meeting again.
            </p>
          </div>
          <Link href="/meetings/new">
            <Button>
              <Plus className="h-4 w-4" />
              New Meeting
            </Button>
          </Link>
        </div>
      </motion.div>

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <p className="flex-1 text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </Button>
        </div>
      )}

      {/* Stats */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        {[
          { label: "Meetings", value: meetings.length, icon: Brain, color: "text-primary" },
          { label: "Pending Commitments", value: pendingCommitments.length, icon: CheckSquare, color: "text-warning" },
          { label: "Contacts", value: uniqueContacts.length, icon: Users, color: "text-success" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
          >
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">
                    {loading ? "-" : stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Recent Meetings */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Recent Meetings
                <Link href="/search" className="text-xs font-normal text-muted-foreground hover:text-primary">
                  View all
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : recentMeetings.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <Brain className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    No meetings yet. Submit your first meeting transcript.
                  </p>
                  <Link href="/meetings/new">
                    <Button variant="outline" size="sm">
                      <Plus className="h-3.5 w-3.5" />
                      Add Meeting
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentMeetings.map((meeting) => (
                    <Link
                      key={meeting.id}
                      href={`/meetings/${meeting.id}`}
                      className="flex items-center justify-between rounded-md p-3 transition-colors hover:bg-accent"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {meeting.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {meeting.participants.join(", ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            meeting.status === "completed"
                              ? "success"
                              : meeting.status === "failed"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {meeting.status}
                        </Badge>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Pending Commitments */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Pending Commitments
                <Link href="/commitments" className="text-xs font-normal text-muted-foreground hover:text-primary">
                  View all
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : pendingCommitments.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <CheckSquare className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    No pending commitments. They will appear after meeting processing.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingCommitments.slice(0, 5).map((c) => (
                    <div
                      key={c.id}
                      className="flex items-start justify-between rounded-md p-3 transition-colors hover:bg-accent"
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-foreground">{c.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.direction === "i_owe"
                            ? `You owe ${c.recipient}`
                            : `${c.owner} owes you`}
                          {c.due_date && ` - due ${new Date(c.due_date).toLocaleDateString()}`}
                        </p>
                      </div>
                      <Badge variant="warning">pending</Badge>
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
