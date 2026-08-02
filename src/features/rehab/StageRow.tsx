import React from "react";
import {
  CheckIcon,
  ExternalLinkIcon,
  LoaderIcon,
  UploadCloudIcon,
} from "lucide-react";

export type Stage = {
  notionPageId: string;
  stageName: string;
  side: string;
  phase: string;
  status: string;
  workDone: boolean;
  photoUploaded: boolean;
  drivePhotoLink: string | null;
  jeremiahApproved: boolean;
  karenApproved: boolean;
  rajApproved: boolean;
  notes: string;
};

export type UploadState = {
  uploading: boolean;
  driveUrl: string;
  saving: boolean;
  saved: boolean;
  error: string;
  progress: string;
};

/** Where this stage sits in the Jeremiah -> Karen -> Raj chain. */
function approvalState(stage: Stage) {
  if (stage.rajApproved) {
    return { text: "Fully approved", className: "bg-[#EAF8EF] text-[#16A34A]" };
  }
  if (stage.karenApproved) {
    return { text: "With Raj", className: "bg-[#EEF5FF] text-[#418BFF]" };
  }
  if (stage.jeremiahApproved) {
    return { text: "With Karen", className: "bg-[#EEF5FF] text-[#418BFF]" };
  }
  return { text: "With Jeremiah", className: "bg-[#FEF3C7] text-[#B45309]" };
}

type StageRowProps = {
  stage: Stage;
  uploadState: UploadState | undefined;
  onUpload: (pageId: string, stageName: string, files: FileList) => void;
  onDone: (pageId: string) => void;
};

export function StageRow({
  stage,
  uploadState,
  onUpload,
  onDone,
}: StageRowProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const us = uploadState || {
    uploading: false,
    driveUrl: "",
    saving: false,
    saved: false,
    error: "",
    progress: "",
  };

  const isComplete = stage.photoUploaded;
  const wasDeclined = !stage.photoUploaded && stage.notes.includes("Declined by");

  /* ── SUBMITTED: waiting somewhere in the chain ── */
  if (isComplete) {
    const state = approvalState(stage);

    return (
      <article className="rounded-2xl border border-[#DCE4EE] bg-white px-4 py-4 shadow-[0_5px_14px_rgba(30,58,138,0.055)] sm:px-5">
        <div className="flex items-center gap-3">
          <span
            className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-white ${
              stage.rajApproved ? "bg-[#16A34A]" : "bg-[#93A3B8]"
            }`}
          >
            <CheckIcon aria-hidden="true" size={14} strokeWidth={3} />
          </span>
          <p
            className={`flex-1 text-[13px] font-bold leading-snug sm:text-[14px] ${
              stage.rajApproved
                ? "text-[#93A3B8] line-through"
                : "text-[#1A1A2E]"
            }`}
          >
            {stage.stageName}
          </p>
          {stage.drivePhotoLink && (
            
            <a
              className="flex items-center gap-1 text-[11px] font-bold text-[#418BFF] hover:underline"
              href={stage.drivePhotoLink}
              rel="noopener noreferrer"
              target="_blank"
            >
              View photos
              <ExternalLinkIcon size={12} strokeWidth={2.5} />
            </a>
          )}
        </div>

        <div className="mt-2.5 flex items-center gap-2 pl-9">
          <span
            className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${state.className}`}
          >
            {state.text}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#A3B0C0]">
            {stage.jeremiahApproved && "Jeremiah ok"}
            {stage.karenApproved && " · Karen ok"}
            {stage.rajApproved && " · Raj ok"}
          </span>
        </div>
      </article>
    );
  }

  /* ── NEEDS PHOTOS (fresh, or sent back) ── */
  return (
    <article className="rounded-2xl border border-[#DCE4EE] bg-white px-4 py-4 shadow-[0_5px_14px_rgba(30,58,138,0.055)] sm:px-5">
      <div className="flex items-center gap-3">
        <span className="h-6 w-6 shrink-0 rounded-md border-2 border-[#93A3B8]" />
        <p className="flex-1 text-[13px] font-bold leading-snug text-[#1A1A2E] sm:text-[14px]">
          {stage.stageName}
        </p>
      </div>

      {wasDeclined && (
        <div className="mt-3 rounded-xl border border-[#FED7BE] bg-[#FFF8F4] px-3.5 py-2.5">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#B94A18]">
            Sent back
          </p>
          <p className="mt-1 text-[11px] font-medium leading-snug text-[#733614]">
            {stage.notes}
          </p>
        </div>
      )}

      <div className="mt-3 flex flex-col gap-2 pl-9">
        <input
          accept="image/*"
          className="hidden"
          multiple
          onChange={(e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
              onUpload(stage.notionPageId, stage.stageName, files);
            }
            e.target.value = "";
          }}
          ref={fileInputRef}
          type="file"
        />

        {!us.uploading && (
          <button
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#418BFF] bg-[#EBF3FF] px-4 py-3 text-[12px] font-bold text-[#418BFF] transition-colors hover:bg-[#DBEAFE] sm:text-[13px]"
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            <UploadCloudIcon size={16} strokeWidth={2.5} />
            {us.driveUrl ? "Add More Photos" : "Upload Photos"}
          </button>
        )}

        {us.uploading && (
          <div className="flex items-center gap-2 rounded-xl bg-[#F1F5F9] px-4 py-3">
            <LoaderIcon
              className="animate-spin text-[#418BFF]"
              size={16}
              strokeWidth={2.5}
            />
            <span className="text-[12px] font-bold text-[#5B6B82]">
              {us.progress
                ? `Uploading ${us.progress} to Google Drive…`
                : "Uploading to Google Drive…"}
            </span>
          </div>
        )}

        <input
          className="w-full rounded-lg border border-[#DCE4EE] bg-[#F8FAFC] px-3 py-2 text-[11px] font-medium text-[#5B6B82] placeholder:text-[#A3B0C0] sm:text-[12px]"
          placeholder="Drive folder link appears here after upload"
          readOnly
          type="text"
          value={us.driveUrl}
        />

        <button
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#16A34A] px-4 py-3 text-[12px] font-bold text-white transition-colors hover:bg-[#15803D] disabled:cursor-not-allowed disabled:bg-[#CBD5E1] disabled:text-[#8A99AC] sm:text-[13px]"
          disabled={!us.driveUrl || us.saving}
          onClick={() => onDone(stage.notionPageId)}
          type="button"
        >
          {us.saving ? (
            <>
              <LoaderIcon className="animate-spin" size={14} strokeWidth={2.5} />
              Saving…
            </>
          ) : (
            <>
              <CheckIcon size={14} strokeWidth={3} />
              Done
            </>
          )}
        </button>

        {us.error && (
          <p className="text-[11px] font-bold text-red-500">{us.error}</p>
        )}
      </div>
    </article>
  );
}