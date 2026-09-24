export const MAX_IMAGE_SIZE = 25 * 1024 * 1024; // 25 MB
export const MAX_VIDEO_SIZE = 2 * 1024 * 1024 * 1024; // 2 GB
export const MAX_THUMBNAIL_SIZE = 2 * 1024 * 1024; // 2 MB

export const MAX_TITLE_LENGTH = 120;
export const MAX_DESCRIPTION_LENGTH = 2000;
export const MAX_TAGS_PER_MEDIA = 10;
export const MAX_TAG_LENGTH = 32;

export const THUMBNAIL_WIDTH = 640;

export const IMAGE_MIME_TYPES: Record<string, readonly string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "image/gif": ["gif"],
};

export const VIDEO_MIME_TYPES: Record<string, readonly string[]> = {
  "video/mp4": ["mp4", "m4v"],
  "video/webm": ["webm"],
  "video/quicktime": ["mov"],
};

export const ACCEPTED_MIME_TYPES = {
  ...IMAGE_MIME_TYPES,
  ...VIDEO_MIME_TYPES,
};

export const ACCEPT_ATTRIBUTE = Object.keys(ACCEPTED_MIME_TYPES).join(",");

export const PAGE_SIZE = 24;
/** Max items rendered on a shared album page in one go. */
export const ALBUM_PAGE_MAX_ITEMS = 200;

export const UPLOAD_SAS_TTL_MINUTES = 60;
export const READ_SAS_TTL_HOURS = 24;
export const DOWNLOAD_SAS_TTL_MINUTES = 15;

export const SITE_NAME = "Luvidos";
export const SITE_TAGLINE = "Media Gallery & Streaming";
export const SITE_DESCRIPTION =
  "Upload, organize, share and stream your images and videos with Luvidos — a fast, modern media platform.";
