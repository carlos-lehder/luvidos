import "server-only";

import {
  BlobSASPermissions,
  BlobServiceClient,
  SASProtocol,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
} from "@azure/storage-blob";
import {
  DOWNLOAD_SAS_TTL_MINUTES,
  READ_SAS_TTL_HOURS,
  UPLOAD_SAS_TTL_MINUTES,
} from "@/lib/config/media";
import { getAzureStorageEnv } from "@/lib/env";

let cached:
  | {
      credential: StorageSharedKeyCredential;
      serviceClient: BlobServiceClient;
      containerName: string;
      accountName: string;
    }
  | undefined;

function getContext() {
  if (cached) return cached;
  const { accountName, accountKey, containerName } = getAzureStorageEnv();
  const credential = new StorageSharedKeyCredential(accountName, accountKey);
  const serviceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    credential,
  );
  cached = { credential, serviceClient, containerName, accountName };
  return cached;
}

function getBlobClient(blobKey: string) {
  const { serviceClient, containerName } = getContext();
  return serviceClient.getContainerClient(containerName).getBlockBlobClient(blobKey);
}

function sanitizeFilename(name: string) {
  return name.replace(/[^\w.\-() ]+/g, "_").slice(0, 120) || "download";
}

/**
 * Aligns SAS expiry to a fixed window so the same URL is generated for the
 * whole window, making it cacheable by Next Image / CDNs.
 */
function bucketedExpiry(ttlMs: number) {
  const now = Date.now();
  const start = Math.floor(now / ttlMs) * ttlMs;
  return {
    startsOn: new Date(start - 5 * 60 * 1000),
    expiresOn: new Date(start + 2 * ttlMs),
  };
}

export const blobKeys = {
  original: (userId: string, mediaId: string) => `${userId}/${mediaId}/original`,
  thumbnail: (userId: string, mediaId: string) => `${userId}/${mediaId}/thumbnail`,
};

export const storageService = {
  /** Short-lived SAS URL the browser uses to PUT a single blob directly to Azure. */
  createUploadUrl(blobKey: string, contentType: string) {
    const { credential, containerName } = getContext();
    const expiresOn = new Date(Date.now() + UPLOAD_SAS_TTL_MINUTES * 60 * 1000);
    const sas = generateBlobSASQueryParameters(
      {
        containerName,
        blobName: blobKey,
        permissions: BlobSASPermissions.parse("cw"),
        startsOn: new Date(Date.now() - 5 * 60 * 1000),
        expiresOn,
        protocol: SASProtocol.Https,
        contentType,
      },
      credential,
    ).toString();
    return { url: `${getBlobClient(blobKey).url}?${sas}`, expiresOn };
  },

  /** Read-only SAS URL (streaming/inline). Supports HTTP range requests natively. */
  getReadUrl(blobKey: string) {
    const { credential, containerName } = getContext();
    const { startsOn, expiresOn } = bucketedExpiry(READ_SAS_TTL_HOURS * 60 * 60 * 1000);
    const sas = generateBlobSASQueryParameters(
      {
        containerName,
        blobName: blobKey,
        permissions: BlobSASPermissions.parse("r"),
        startsOn,
        expiresOn,
        protocol: SASProtocol.Https,
      },
      credential,
    ).toString();
    return `${getBlobClient(blobKey).url}?${sas}`;
  },

  /** Read SAS URL that forces a download with the original filename. */
  createDownloadUrl(blobKey: string, fileName: string) {
    const { credential, containerName } = getContext();
    const sas = generateBlobSASQueryParameters(
      {
        containerName,
        blobName: blobKey,
        permissions: BlobSASPermissions.parse("r"),
        startsOn: new Date(Date.now() - 5 * 60 * 1000),
        expiresOn: new Date(Date.now() + DOWNLOAD_SAS_TTL_MINUTES * 60 * 1000),
        protocol: SASProtocol.Https,
        contentDisposition: `attachment; filename="${sanitizeFilename(fileName)}"`,
      },
      credential,
    ).toString();
    return `${getBlobClient(blobKey).url}?${sas}`;
  },

  async getBlobProperties(blobKey: string) {
    const client = getBlobClient(blobKey);
    try {
      const props = await client.getProperties();
      return {
        exists: true as const,
        contentLength: props.contentLength ?? 0,
        contentType: props.contentType ?? null,
      };
    } catch (error) {
      if (isNotFound(error)) return { exists: false as const };
      throw error;
    }
  },

  async downloadToBuffer(blobKey: string) {
    return getBlobClient(blobKey).downloadToBuffer();
  },

  async uploadBuffer(blobKey: string, data: Buffer, contentType: string) {
    await getBlobClient(blobKey).uploadData(data, {
      blobHTTPHeaders: { blobContentType: contentType, blobCacheControl: "public, max-age=31536000, immutable" },
    });
  },

  async setContentHeaders(blobKey: string, contentType: string) {
    await getBlobClient(blobKey).setHTTPHeaders({
      blobContentType: contentType,
      blobCacheControl: "public, max-age=31536000, immutable",
    });
  },

  async deleteBlob(blobKey: string) {
    await getBlobClient(blobKey).deleteIfExists({ deleteSnapshots: "include" });
  },

  async deleteBlobs(blobKeys: (string | null | undefined)[]) {
    await Promise.all(blobKeys.filter((k): k is string => !!k).map((k) => this.deleteBlob(k)));
  },

  /** Hostname to whitelist in next.config images.remotePatterns. */
  getHostname() {
    return `${getContext().accountName}.blob.core.windows.net`;
  },
};

function isNotFound(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    (error as { statusCode?: number }).statusCode === 404
  );
}
