import { EyeIcon, FilmIcon, HardDriveIcon, ImageIcon, TrendingUpIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/media/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MAX_IMAGE_SIZE, MAX_VIDEO_SIZE } from "@/lib/config/media";
import { mediaService } from "@/lib/services/media.service";
import { userService } from "@/lib/services/user.service";
import { getCurrentUser } from "@/lib/supabase/server";
import { formatBytes, formatCount, formatDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Analytics", robots: { index: false } };

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [stats, recentViews, top] = await Promise.all([
    userService.getDashboardStats(),
    userService.getRecentViews(user.id, 30),
    mediaService.listOwn(user.id, { limit: 60 }),
  ]);

  const { last7, perDay } = summarizeViews(recentViews.map((v) => v.createdAt), 14);
  const topMedia = [...top.items].sort((a, b) => b.viewCount - a.viewCount).slice(0, 10);
  const max = Math.max(1, ...perDay.map((d) => d.count));

  return (
    <>
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">How your media is performing.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={EyeIcon} label="All-time views" value={formatCount(stats.total_views)} />
        <StatCard icon={TrendingUpIcon} label="Views (30 days)" value={formatCount(recentViews.length)} hint={`${formatCount(last7)} in the last 7 days`} />
        <StatCard icon={ImageIcon} label="Images / Videos" value={`${formatCount(stats.total_images)} / ${formatCount(stats.total_videos)}`} />
        <StatCard
          icon={HardDriveIcon}
          label="Storage used"
          value={formatBytes(stats.storage_bytes)}
          hint={`Limits: ${formatBytes(MAX_IMAGE_SIZE, 0)} / image · ${formatBytes(MAX_VIDEO_SIZE, 0)} / video`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Views — last 14 days</CardTitle>
            <CardDescription>Daily views across all your media.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentViews.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No views recorded yet.</p>
            ) : (
              <div className="flex h-40 items-end gap-1.5" role="img" aria-label="Bar chart of daily views">
                {perDay.map((d) => (
                  <div key={d.day} className="group/bar flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-sm bg-primary/80 transition-colors group-hover/bar:bg-primary"
                      style={{ height: `${Math.max(4, (d.count / max) * 100)}%` }}
                      title={`${d.count} views on ${formatDate(d.day)}`}
                    />
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {new Date(d.day).getDate()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top media</CardTitle>
            <CardDescription>Your most viewed uploads.</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            {topMedia.length === 0 ? (
              <div className="px-4">
                <EmptyState title="No media yet" description="Upload something to start collecting stats." />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="pr-4 text-right">Views</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topMedia.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="max-w-64 truncate pl-4">
                        <Link href={`/media/${m.id}`} className="hover:underline">
                          {m.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 capitalize text-muted-foreground">
                          {m.type === "video" ? <FilmIcon className="size-3.5" /> : <ImageIcon className="size-3.5" />}
                          {m.type}
                        </span>
                      </TableCell>
                      <TableCell className="pr-4 text-right tabular-nums">{formatCount(m.viewCount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function summarizeViews(timestamps: string[], days: number) {
  const now = Date.now();
  const last7 = timestamps.filter((ts) => Date.parse(ts) > now - 7 * 86400 * 1000).length;

  const buckets = new Map<string, number>();
  const today = new Date(now);
  today.setUTCHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() - i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const ts of timestamps) {
    const key = ts.slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return { last7, perDay: Array.from(buckets, ([day, count]) => ({ day, count })) };
}
