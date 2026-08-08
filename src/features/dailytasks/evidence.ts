import imageCompression from "browser-image-compression";
import { supabase } from "../../lib/supabase";
import { apiFetch } from "../../lib/apiFetch";

const BUCKET = "task-evidence";

/** Mirrors the allowlist on the bucket and in api/task-evidence.js. */
export const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
];

export const ACCEPT_ATTRIBUTE = "image/*,application/pdf";
export const MAX_BYTES = 10 * 1024 * 1024;

export type EvidenceFile = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
};

function asJpgName(name: string) {
  return name.replace(/\.[^.]+$/, "") + ".jpg";
}

/**
 * Shrink photos before they leave the phone. A typical 8 MB camera shot lands
 * around 400 KB, which is the difference between filling 1 GB of storage in a
 * fortnight and in several years.
 */
export async function prepareFile(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  // Chrome cannot decode HEIC into a canvas, so compression would fail and
  // produce a blank image. Leave those alone.
  if (file.type === "image/heic" || file.type === "image/heif") return file;

  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: 0.6,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: "image/jpeg",
      initialQuality: 0.82,
    });

    // Small screenshots sometimes come back bigger. Keep the smaller one.
    if (compressed.size >= file.size) return file;

    return new File([compressed], asJpgName(file.name), {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch (err) {
    console.error("Compression failed, uploading the original:", err);
    return file;
  }
}

/**
 * Three steps: ask the server for a one-shot signed URL scoped to a single
 * path, PUT the bytes straight to Storage, then record the row. The browser
 * never holds a key that can write anywhere else.
 */
export async function uploadEvidence(taskId: string, original: File) {
  const file = await prepareFile(original);

  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new Error(`${original.name} is not an image or PDF`);
  }
  if (file.size > MAX_BYTES) {
    throw new Error(`${original.name} is still over 10 MB after compression`);
  }

  const signRes = await apiFetch("/api/task-evidence", {
    method: "POST",
    body: JSON.stringify({
      taskId,
      mimeType: file.type,
      sizeBytes: file.size,
    }),
  });

  const signed = await signRes.json().catch(() => ({}));
  if (!signRes.ok) {
    throw new Error(signed?.error || "Could not start the upload");
  }

  const { error } = await supabase.storage
    .from(BUCKET)
    .uploadToSignedUrl(signed.path, signed.token, file, {
      contentType: file.type,
    });

  if (error) throw new Error(error.message);

  const recordRes = await apiFetch("/api/task-evidence", {
    method: "PATCH",
    body: JSON.stringify({
      taskId,
      path: signed.path,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    }),
  });

  const record = await recordRes.json().catch(() => ({}));
  if (!recordRes.ok) {
    throw new Error(record?.error || "Uploaded, but could not be recorded");
  }

  return record.file;
}

export async function deleteEvidence(fileId: string) {
  const res = await apiFetch("/api/task-evidence", {
    method: "DELETE",
    body: JSON.stringify({ fileId }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || "Could not remove that file");
}

/** Signed download links, valid for ten minutes. */
export async function loadEvidenceUrls(
  taskId: string,
): Promise<EvidenceFile[]> {
  const res = await apiFetch(
    `/api/task-evidence?taskId=${encodeURIComponent(taskId)}`,
  );

  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || "Could not load the files");

  return Array.isArray(body.files) ? body.files : [];
}
