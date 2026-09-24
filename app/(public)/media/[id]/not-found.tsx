import { FileQuestionIcon } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/media/empty-state";
import { Button } from "@/components/ui/button";

export default function MediaNotFound() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-20 sm:px-6">
      <EmptyState
        icon={FileQuestionIcon}
        title="Media not found"
        description="This item may have been removed, made private, or the link is incorrect."
        action={
          <Button render={<Link href="/" />}>Go home</Button>
        }
      />
    </div>
  );
}
