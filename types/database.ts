export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type MediaType = "image" | "video";
export type MediaVisibility = "public" | "unlisted" | "private";
export type MediaStatus = "pending" | "processing" | "ready" | "failed";
export type UploadStatus =
  | "pending"
  | "uploading"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export type ProfileRow = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
};

export type AlbumRow = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  visibility: MediaVisibility;
  cover_media_id: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
};

/** Row of the `album_cards` view (album + aggregated counts + cover). */
export type AlbumCardRow = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  visibility: MediaVisibility;
  view_count: number;
  created_at: string;
  updated_at: string;
  media_count: number;
  image_count: number;
  video_count: number;
  total_size: number;
  cover_media_id: string | null;
  cover_type: MediaType | null;
  cover_blob_key: string | null;
  cover_thumbnail_blob_key: string | null;
};

export type MediaRow = {
  id: string;
  owner_id: string;
  album_id: string;
  type: MediaType;
  title: string;
  description: string | null;
  file_name: string;
  mime_type: string;
  file_size: number;
  blob_key: string;
  thumbnail_blob_key: string | null;
  width: number | null;
  height: number | null;
  duration: number | null;
  status: MediaStatus;
  view_count: number;
  created_at: string;
  updated_at: string;
};

export type TagRow = {
  id: string;
  name: string;
  created_at: string;
};

export type AlbumTagRow = {
  album_id: string;
  tag_id: string;
};

export type MediaViewRow = {
  id: number;
  media_id: string;
  viewer_id: string | null;
  metadata: Json | null;
  created_at: string;
};

export type UploadSessionRow = {
  id: string;
  user_id: string;
  media_id: string | null;
  status: UploadStatus;
  file_name: string;
  mime_type: string;
  file_size: number;
  error: string | null;
  created_at: string;
  completed_at: string | null;
};

export type DashboardStats = {
  total_albums: number;
  total_media: number;
  total_images: number;
  total_videos: number;
  total_views: number;
  storage_bytes: number;
};

type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: WithOptional<
          ProfileRow,
          "display_name" | "avatar_url" | "bio" | "created_at" | "updated_at"
        >;
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      albums: {
        Row: AlbumRow;
        Insert: WithOptional<
          AlbumRow,
          | "id"
          | "description"
          | "visibility"
          | "cover_media_id"
          | "view_count"
          | "created_at"
          | "updated_at"
        >;
        Update: Partial<AlbumRow>;
        Relationships: [
          {
            foreignKeyName: "albums_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      media: {
        Row: MediaRow;
        Insert: WithOptional<
          MediaRow,
          | "id"
          | "description"
          | "thumbnail_blob_key"
          | "width"
          | "height"
          | "duration"
          | "status"
          | "view_count"
          | "created_at"
          | "updated_at"
        >;
        Update: Partial<MediaRow>;
        Relationships: [
          {
            foreignKeyName: "media_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "media_album_id_fkey";
            columns: ["album_id"];
            isOneToOne: false;
            referencedRelation: "albums";
            referencedColumns: ["id"];
          },
        ];
      };
      tags: {
        Row: TagRow;
        Insert: WithOptional<TagRow, "id" | "created_at">;
        Update: Partial<TagRow>;
        Relationships: [];
      };
      album_tags: {
        Row: AlbumTagRow;
        Insert: AlbumTagRow;
        Update: Partial<AlbumTagRow>;
        Relationships: [
          {
            foreignKeyName: "album_tags_album_id_fkey";
            columns: ["album_id"];
            isOneToOne: false;
            referencedRelation: "albums";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "album_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          },
        ];
      };
      media_views: {
        Row: MediaViewRow;
        Insert: WithOptional<MediaViewRow, "id" | "viewer_id" | "metadata" | "created_at">;
        Update: Partial<MediaViewRow>;
        Relationships: [
          {
            foreignKeyName: "media_views_media_id_fkey";
            columns: ["media_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
        ];
      };
      upload_sessions: {
        Row: UploadSessionRow;
        Insert: WithOptional<
          UploadSessionRow,
          "id" | "media_id" | "status" | "error" | "created_at" | "completed_at"
        >;
        Update: Partial<UploadSessionRow>;
        Relationships: [
          {
            foreignKeyName: "upload_sessions_media_id_fkey";
            columns: ["media_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      album_cards: {
        Row: AlbumCardRow;
        Relationships: [];
      };
    };
    Functions: {
      can_access_album: {
        Args: { p_album_id: string };
        Returns: boolean;
      };
      get_album_detail: {
        Args: { p_id: string };
        Returns: AlbumCardRow[];
      };
      get_album_tags: {
        Args: { p_album_id: string };
        Returns: string[];
      };
      get_album_media: {
        Args: { p_album_id: string; p_limit?: number; p_offset?: number };
        Returns: MediaRow[];
      };
      count_album_media: {
        Args: { p_album_id: string };
        Returns: number;
      };
      get_media_detail: {
        Args: { p_id: string };
        Returns: MediaRow[];
      };
      record_media_view: {
        Args: { p_media_id: string; p_metadata?: Json };
        Returns: undefined;
      };
      record_album_view: {
        Args: { p_album_id: string };
        Returns: undefined;
      };
      get_dashboard_stats: {
        Args: Record<string, never>;
        Returns: DashboardStats;
      };
    };
    Enums: {
      media_type: MediaType;
      media_visibility: MediaVisibility;
      media_status: MediaStatus;
      upload_status: UploadStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
