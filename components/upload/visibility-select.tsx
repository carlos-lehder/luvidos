"use client";

import { LinkIcon, LockIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MediaVisibility } from "@/types/media";

export const VISIBILITY_OPTIONS: {
  value: MediaVisibility;
  label: string;
  description: string;
  icon: typeof LinkIcon;
}[] = [
  { value: "unlisted", label: "Anyone with the link", description: "Not listed anywhere; only people you share the link with", icon: LinkIcon },
  { value: "private", label: "Only me", description: "Visible only when you are signed in", icon: LockIcon },
];

export function VisibilitySelect({
  id,
  value,
  onChange,
  disabled,
  className,
}: {
  id?: string;
  value: MediaVisibility;
  onChange: (value: MediaVisibility) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => v && onChange(v as MediaVisibility)}
      disabled={disabled}
      items={VISIBILITY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
    >
      <SelectTrigger id={id} className={className ?? "w-full"}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {VISIBILITY_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <option.icon className="text-muted-foreground" />
            <span className="flex flex-col">
              <span>{option.label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
