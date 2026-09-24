import { GlobeIcon, LinkIcon, LockIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { MediaVisibility } from "@/types/database";

const CONFIG: Record<MediaVisibility, { label: string; icon: typeof GlobeIcon }> = {
  public: { label: "Public", icon: GlobeIcon },
  unlisted: { label: "Link", icon: LinkIcon },
  private: { label: "Private", icon: LockIcon },
};

export function VisibilityBadge({ visibility }: { visibility: MediaVisibility }) {
  const { label, icon: Icon } = CONFIG[visibility];
  return (
    <Badge variant="outline" className="bg-background/80 backdrop-blur">
      <Icon />
      {label}
    </Badge>
  );
}
