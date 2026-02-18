"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Loader2, RefreshCw, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getMeetings, getCommitments } from "@/lib/api";
import type { Meeting, Commitment } from "@/lib/api";

interface ContactSummary {
  name: string;
  meetingCount: number;
  lastMeeting: string;
  pendingCommitments: number;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<ContactSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function loadContacts() {
    setLoading(true);
    setError("");
    Promise.all([getMeetings(), getCommitments()])
      .then(([meetings, commitments]) => {
        const contactMap = new Map<string, ContactSummary>();

        for (const m of meetings) {
          for (const p of m.participants) {
            const existing = contactMap.get(p);
            if (!existing) {
              contactMap.set(p, {
                name: p,
                meetingCount: 1,
                lastMeeting: m.meeting_date,
                pendingCommitments: 0,
              });
            } else {
              existing.meetingCount++;
              if (m.meeting_date > existing.lastMeeting) {
                existing.lastMeeting = m.meeting_date;
              }
            }
          }
        }

        for (const c of commitments) {
          if (c.status !== "completed") {
            const owner = contactMap.get(c.owner);
            if (owner) owner.pendingCommitments++;
            const recipient = contactMap.get(c.recipient);
            if (recipient && recipient !== owner) recipient.pendingCommitments++;
          }
        }

        setContacts(
          Array.from(contactMap.values()).sort(
            (a, b) => b.meetingCount - a.meetingCount
          )
        );
      })
      .catch(() => setError("Failed to load contacts."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadContacts();
  }, []);

  return (
    <div className="mx-auto max-w-3xl p-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="font-display text-3xl text-foreground">Contacts</h1>
        <p className="mt-1 mb-6 text-muted-foreground">
          People from your meetings with their history and commitments.
        </p>
      </motion.div>

      {error && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <p className="flex-1 text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={loadContacts}>
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : contacts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <Users className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-muted-foreground">
            No contacts yet. Submit a meeting to get started.
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>{contacts.length} contacts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {contacts.map((contact, i) => (
                <motion.div
                  key={contact.name}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.03 }}
                >
                  <Link
                    href={`/contacts/${encodeURIComponent(contact.name)}`}
                    className="flex items-center justify-between rounded-md p-3 transition-colors hover:bg-accent"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {contact.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {contact.meetingCount} meeting
                          {contact.meetingCount !== 1 ? "s" : ""} - Last:{" "}
                          {new Date(contact.lastMeeting).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {contact.pendingCommitments > 0 && (
                        <Badge variant="warning">
                          {contact.pendingCommitments} open
                        </Badge>
                      )}
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
