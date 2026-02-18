"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Send, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitMeeting } from "@/lib/api";

export default function NewMeetingPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [participants, setParticipants] = useState("");
  const [meetingDate, setMeetingDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!title.trim() || !notes.trim()) {
      setError("Meeting title and notes are required.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitMeeting({
        title: title.trim(),
        participants: participants
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean),
        meeting_date: new Date(meetingDate + "T12:00:00Z").toISOString(),
        notes: notes.trim(),
      });
      router.push(`/meetings/${result.meeting_id}`);
    } catch {
      setError("Failed to submit meeting. Is the backend running?");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="font-display text-3xl text-foreground">New Meeting</h1>
        <p className="mt-1 mb-6 text-muted-foreground">
          Paste a meeting transcript to extract memories and commitments.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Meeting Details</CardTitle>
            <CardDescription>
              The AI will analyze the transcript to extract commitments, decisions, and key facts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Meeting Title
                </label>
                <Input
                  placeholder="e.g. Weekly Standup with Alice"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Meeting Date
                </label>
                <Input
                  type="date"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Participants
                </label>
                <Input
                  placeholder="Alice, Bob, Charlie (comma-separated)"
                  value={participants}
                  onChange={(e) => setParticipants(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Meeting Notes / Transcript
                </label>
                <Textarea
                  placeholder="Paste the full meeting transcript or notes here..."
                  rows={12}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {submitting ? "Submitting..." : "Submit Meeting"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
