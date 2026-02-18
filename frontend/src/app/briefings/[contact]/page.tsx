"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Brain, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { streamBriefing } from "@/lib/api";

export default function BriefingPage() {
  const { contact } = useParams<{ contact: string }>();
  const contactName = decodeURIComponent(contact || "");
  const [content, setContent] = useState("");
  const [streaming, setStreaming] = useState(true);
  const [error, setError] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contactName) return;

    setContent("");
    setStreaming(true);
    setError("");

    const cleanup = streamBriefing(
      contactName,
      (token) => {
        setContent((prev) => prev + token);
      },
      () => {
        setStreaming(false);
      },
      (err) => {
        setError(err.message);
        setStreaming(false);
      }
    );

    return cleanup;
  }, [contactName]);

  // Auto-scroll during streaming
  useEffect(() => {
    if (contentRef.current && streaming) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [content, streaming]);

  return (
    <div className="mx-auto max-w-2xl p-8">
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

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-3xl text-foreground">
              {contactName}
            </h1>
            <p className="text-sm text-muted-foreground">Contact Briefing</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {streaming && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
              {streaming
                ? "Generating briefing..."
                : error
                  ? "Error"
                  : "Briefing Ready"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : content ? (
              <div
                ref={contentRef}
                className="max-h-[60vh] overflow-y-auto prose prose-invert prose-sm max-w-none"
              >
                <div className="text-sm text-foreground leading-relaxed prose prose-invert prose-headings:text-primary prose-headings:font-display prose-strong:text-foreground prose-li:text-foreground max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {content}
                  </ReactMarkdown>
                  {streaming && (
                    <span className="inline-block h-4 w-0.5 animate-pulse bg-primary ml-0.5" />
                  )}
                </div>
              </div>
            ) : streaming ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Retrieving memories and preparing briefing...
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No briefing content available.
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
