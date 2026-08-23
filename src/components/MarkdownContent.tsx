"use client";
import { useEffect, useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

export default function MarkdownContent({ content }: { content: string }) {
  const [html, setHtml] = useState("");
  useEffect(() => {
    const raw = marked.parse(content || "", { async: false }) as string;
    setHtml(DOMPurify.sanitize(raw));
  }, [content]);
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
