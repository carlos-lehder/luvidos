"use client";

import { CheckIcon, LinkIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CopyLinkButton({
  url,
  title,
  size = "sm",
  variant = "outline",
  label = "Copy link",
}: {
  url: string;
  title?: string;
  size?: "sm" | "default";
  variant?: "outline" | "ghost" | "secondary";
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    if (typeof navigator.share === "function" && /Mobi|Android/i.test(navigator.userAgent)) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // dismissed → fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy link");
    }
  }

  return (
    <Button size={size} variant={variant} onClick={share}>
      {copied ? <CheckIcon data-icon="inline-start" /> : <LinkIcon data-icon="inline-start" />}
      {label}
    </Button>
  );
}
