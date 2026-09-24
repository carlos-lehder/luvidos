import { FolderXIcon } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/media/empty-state";
import { Button } from "@/components/ui/button";

export default function AlbumNotFound() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-20 sm:px-6">
      <EmptyState
        icon={FolderXIcon}
        title="Album not found"
        description="This album may have been removed, made private, or the link is incorrect."
        action={<Button render={<Link href="/" />}>Go home</Button>}
      />
    </div>
  );
}
