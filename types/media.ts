import type {
  AlbumCardRow,
  MediaRow,
  MediaStatus,
  MediaType,
  MediaVisibility,
  ProfileRow,
} from "./database";

export type { MediaType, MediaVisibility, MediaStatus };

export interface Owner {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export type OwnerRow = Pick<ProfileRow, "id" | "username" | "display_name" | "avatar_url">;

/** Media row enriched with resolved URLs, safe to pass to client components. */
export interface MediaItem {
  id: string;
  ownerId: string;
  albumId: string;
  type: MediaType;
  title: string;
  description: string | null;
  fileName: string;
  mimeType: string;
  fileSize: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  status: MediaStatus;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  url: string;
  thumbnailUrl: string | null;
  owner: Owner | null;
}

/** Album (folder) card with counts and cover, safe for client components. */
export interface AlbumItem {
  id: string;
  ownerId: string;
  title: string;
  description: string | null;
  visibility: MediaVisibility;
  viewCount: number;
  mediaCount: number;
  imageCount: number;
  videoCount: number;
  totalSize: number;
  coverMediaId: string | null;
  coverUrl: string | null;
  coverType: MediaType | null;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  owner: Owner | null;
}

export interface Page<T> {
  items: T[];
  nextOffset: number | null;
  total?: number;
}

export type MediaRowWithOwner = MediaRow & { profiles: OwnerRow | null };
export type AlbumCardRowWithOwner = AlbumCardRow & { profiles: OwnerRow | null };
