"use client";

import { FolderIcon, LayoutDashboardIcon, LogOutIcon, UploadIcon } from "lucide-react";
import Link from "next/link";
import { signOutAction } from "@/app/actions/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/utils/format";
import type { ProfileRow } from "@/types/database";

export function UserMenu({ profile, email }: { profile: ProfileRow; email: string | null }) {
  const name = profile.display_name ?? profile.username;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" className="rounded-full" />}
        aria-label="Open account menu"
      >
        <Avatar>
          {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt="" />}
          <AvatarFallback>{getInitials(name)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-foreground">{name}</span>
          {email && <span className="truncate text-xs font-normal">{email}</span>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link href="/dashboard" />}>
            <LayoutDashboardIcon /> Dashboard
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/dashboard/albums" />}>
            <FolderIcon /> My albums
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/dashboard/upload" />}>
            <UploadIcon /> Upload
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <form action={signOutAction}>
          <DropdownMenuItem
            variant="destructive"
            render={<button type="submit" className="w-full" />}
          >
            <LogOutIcon /> Sign out
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
