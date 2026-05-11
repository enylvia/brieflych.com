"use client";

import {
  useMemo,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  type RefObject,
} from "react";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Loader2,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";

import type { AtsScoreResult, CareerToolResult, JobMatchResult } from "@/lib/career-tools";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080").replace(/\/$/, "");
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_JOB_DESCRIPTION_LENGTH = 12000;
const ACCEPTED_EXTENSIONS = [".pdf", ".docx"];
const PRIVACY_COPY = "CV kamu hanya diproses untuk analisis dan tidak disimpan permanen oleh sistem.";

type ActiveTool = "ats" | "match";
type ToolError = {
  message: string;
  tone: "warning" | "error";
};
type BackendEnvelope<T> = {
  api_message?: string;
  count?: number;
  data: T;
};

export function CareerToolsPanel({
  tool,
  initialJobId,
  initialJobTitle,
}: {
  tool: ActiveTool;
  initialJobId?: string;
  initialJobTitle?: string;
}) {
  const activeTool = tool;
  const [atsFile, setAtsFile] = useState<File | null>(null);
  const [matchFile, setMatchFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [atsDescription, setAtsDescription] = useState("");
  const [matchMode, setMatchMode] = useState<"job" | "manual">(initialJobId ? "job" : "manual");
  const [jobId, setJobId] = useState(initialJobId ?? "");
  const [jobTitle, setJobTitle] = useState(initialJobTitle ?? "");
  const [matchDescription, setMatchDescription] = useState("");
  const [loading, setLoading] = useState<ActiveTool | null>(null);
  const [error, setError] = useState<ToolError | null>(null);
  const [result, setResult] = useState<CareerToolResult | null>(null);
  const atsFileInputRef = useRef<HTMLInputElement>(null);
  const matchFileInputRef = useRef<HTMLInputElement>(null);

  const activeFile = activeTool === "ats" ? atsFile : matchFile;
  const isLoading = loading !== null;
  const atsDescriptionLimitText = `${atsDescription.length}/${MAX_JOB_DESCRIPTION_LENGTH}`;
  const matchDescriptionLimitText = `${matchDescription.length}/${MAX_JOB_DESCRIPTION_LENGTH}`;
  const analyticsPath = activeTool === "ats" ? "/career-tools/ats-score" : "/career-tools/job-match";

  useEffect(() => {
    void trackEvent({
      event_name: "career_tool_opened",
      path: analyticsPath,
      metadata: {
        tool: activeTool === "ats" ? "ats_score" : "job_match",
        prefilled_job_id: Boolean(initialJobId),
      },
    });
  }, [activeTool, analyticsPath, initialJobId]);

  async function handleAtsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const validationError = validateFile(atsFile);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!atsFile) {
      return;
    }

    const formData = new FormData();
    formData.append("file", atsFile);
    if (targetRole.trim()) {
      formData.append("target_role", targetRole.trim());
    }
    if (atsDescription.trim()) {
      formData.append("job_description", atsDescription.trim());
    }

    void trackEvent({
      event_name: "career_tool_submitted",
      path: "/career-tools/ats-score",
      metadata: {
        tool: "ats_score",
        file_type: getFileExtension(atsFile.name),
        file_size_bytes: atsFile.size,
        has_target_role: Boolean(targetRole.trim()),
        has_job_description: Boolean(atsDescription.trim()),
        job_description_length: atsDescription.trim().length,
      },
    });

    const response = await submitTool<AtsScoreResult>("/tools/cv/ats-score", formData, "ats");
    if (response) {
      setResult({ type: "ats", data: response });
    }
  }

  async function handleMatchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const validationError = validateFile(matchFile);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!matchFile) {
      return;
    }

    const normalizedJobId = jobId.trim();
    const normalizedDescription = matchDescription.trim();
    if (matchMode === "job" && !normalizedJobId) {
      setError({ tone: "warning", message: "Pilih atau isi job ID terlebih dahulu." });
      return;
    }
    if (matchMode === "manual" && !normalizedDescription) {
      setError({ tone: "warning", message: "Isi job description manual terlebih dahulu." });
      return;
    }

    const formData = new FormData();
    formData.append("file", matchFile);
    if (matchMode === "job") {
      formData.append("job_id", normalizedJobId);
    } else {
      if (jobTitle.trim()) {
        formData.append("job_title", jobTitle.trim());
      }
      formData.append("job_description", normalizedDescription);
    }

    void trackEvent({
      event_name: "career_tool_submitted",
      path: "/career-tools/job-match",
      metadata: {
        tool: "job_match",
        mode: matchMode,
        file_type: getFileExtension(matchFile.name),
        file_size_bytes: matchFile.size,
        has_job_id: Boolean(normalizedJobId),
        has_job_title: Boolean(jobTitle.trim()),
        job_description_length: normalizedDescription.length,
      },
    });

    const response = await submitTool<JobMatchResult>("/tools/cv/job-match", formData, "match");
    if (response) {
      setResult({ type: "match", data: response });
    }
  }

  async function submitTool<T>(path: string, formData: FormData, tool: ActiveTool) {
    setLoading(tool);
    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        method: "POST",
        body: formData,
      });

      let payload: BackendEnvelope<T> | null = null;
      try {
        payload = await response.json();
      } catch {}

      if (!response.ok) {
        setError(mapToolError(response.status, payload?.api_message));
        void trackToolFailed(tool, response.status);
        return null;
      }

      void trackToolCompleted(tool, payload?.data);
      return payload?.data ?? null;
    } catch {
      setError({
        tone: "error",
        message: "Analisis belum bisa diproses. Coba lagi beberapa saat lagi.",
      });
      void trackToolFailed(tool, undefined, "network_error");
      return null;
    } finally {
      setLoading(null);
    }
  }

  function handleAtsFileChange(event: ChangeEvent<HTMLInputElement>) {
    setAtsFile(event.target.files?.[0] ?? null);
    setError(null);
  }

  function handleMatchFileChange(event: ChangeEvent<HTMLInputElement>) {
    setMatchFile(event.target.files?.[0] ?? null);
    setError(null);
  }

  const resultTitle = useMemo(() => {
    if (!result) {
      return "Hasil analisis akan tampil di sini";
    }

    return result.type === "ats" ? "Hasil Skor CV ATS" : "Hasil CV vs Lowongan";
  }, [result]);

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
      <div className="space-y-5">
        <div className="rounded-[24px] border border-[#dbe2f1] bg-[#eef2ff] p-4 text-sm leading-6 text-[#5c6478] dark:border-slate-700/70 dark:bg-slate-900/78">
          <p className="font-semibold text-[#141b2d]">File rules</p>
          <p className="mt-1">Format PDF/DOCX, maksimal 5MB. Isi CV tidak disimpan di browser dan tidak dikirim ke analytics.</p>
          {activeFile ? <p className="mt-2 font-medium text-[#4b41e7]">Selected: {activeFile.name}</p> : null}
        </div>

        <div className="rounded-[28px] border border-white/80 bg-white/92 p-5 shadow-[0_28px_70px_-52px_rgba(17,24,39,0.36)] dark:border-slate-700/70 dark:bg-slate-900/78">
          <div className="mb-5 rounded-2xl border border-[#c8f0d8] bg-[#eefcf3] px-4 py-3 text-sm leading-6 text-[#276749] dark:border-emerald-500/24 dark:bg-emerald-950/22 dark:text-emerald-200">
            <div className="flex gap-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" />
              <span>{PRIVACY_COPY}</span>
            </div>
          </div>

          {activeTool === "ats" ? (
            <form className="space-y-5" onSubmit={handleAtsSubmit}>
              <FilePicker
                label="Upload CV"
                file={atsFile}
                inputRef={atsFileInputRef}
                onChange={handleAtsFileChange}
                onClear={() => {
                  setAtsFile(null);
                  if (atsFileInputRef.current) {
                    atsFileInputRef.current.value = "";
                  }
                }}
              />

              <Field label="Target Role" hint="Opsional">
                <input
                  value={targetRole}
                  onChange={(event) => setTargetRole(event.target.value)}
                  placeholder="Contoh: Frontend Engineer"
                  className="h-11 w-full rounded-xl border border-[#dbe2f1] bg-[#fbfcff] px-4 text-sm outline-none focus:border-[#4b41e7]"
                />
              </Field>

              <Field label="Job Description" hint={`Opsional, ${atsDescriptionLimitText}`}>
                <textarea
                  value={atsDescription}
                  onChange={(event) => setAtsDescription(event.target.value.slice(0, MAX_JOB_DESCRIPTION_LENGTH))}
                  rows={6}
                  placeholder="Tempel job description jika ingin keyword match lebih spesifik."
                  className="w-full resize-none rounded-xl border border-[#dbe2f1] bg-[#fbfcff] px-4 py-3 text-sm leading-6 outline-none focus:border-[#4b41e7]"
                />
              </Field>

              <SubmitButton loading={loading === "ats"} disabled={isLoading}>
                Analyze CV
              </SubmitButton>
            </form>
          ) : (
            <form className="space-y-5" onSubmit={handleMatchSubmit}>
              <FilePicker
                label="Upload CV"
                file={matchFile}
                inputRef={matchFileInputRef}
                onChange={handleMatchFileChange}
                onClear={() => {
                  setMatchFile(null);
                  if (matchFileInputRef.current) {
                    matchFileInputRef.current.value = "";
                  }
                }}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <ModeButton active={matchMode === "job"} onClick={() => setMatchMode("job")}>
                  Job dari database
                </ModeButton>
                <ModeButton active={matchMode === "manual"} onClick={() => setMatchMode("manual")}>
                  Manual description
                </ModeButton>
              </div>

              {matchMode === "job" ? (
                <Field label="Job ID" hint={initialJobTitle ? `Dari: ${initialJobTitle}` : "Wajib untuk mode database"}>
                  <input
                    value={jobId}
                    onChange={(event) => setJobId(event.target.value)}
                    placeholder="Contoh: 8a2f1c0b-4d9d-4d77-9f3f-0ff8d8169d68"
                    className="h-11 w-full rounded-xl border border-[#dbe2f1] bg-[#fbfcff] px-4 text-sm outline-none focus:border-[#4b41e7]"
                  />
                </Field>
              ) : (
                <>
                  <Field label="Job Title" hint="Opsional">
                    <input
                      value={jobTitle}
                      onChange={(event) => setJobTitle(event.target.value)}
                      placeholder="Contoh: Product Designer"
                      className="h-11 w-full rounded-xl border border-[#dbe2f1] bg-[#fbfcff] px-4 text-sm outline-none focus:border-[#4b41e7]"
                    />
                  </Field>
                  <Field label="Job Description" hint={`Wajib, ${matchDescriptionLimitText}`}>
                    <textarea
                      value={matchDescription}
                      onChange={(event) => setMatchDescription(event.target.value.slice(0, MAX_JOB_DESCRIPTION_LENGTH))}
                      rows={8}
                      placeholder="Tempel job description target lowongan."
                      className="w-full resize-none rounded-xl border border-[#dbe2f1] bg-[#fbfcff] px-4 py-3 text-sm leading-6 outline-none focus:border-[#4b41e7]"
                    />
                  </Field>
                </>
              )}

              <SubmitButton loading={loading === "match"} disabled={isLoading}>
                Analyze Match
              </SubmitButton>
            </form>
          )}
        </div>

      </div>

      <div className="rounded-[28px] border border-white/80 bg-white/92 p-5 shadow-[0_28px_70px_-52px_rgba(17,24,39,0.36)] dark:border-slate-700/70 dark:bg-slate-900/78 xl:sticky xl:top-24 xl:self-start">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b91a7]">Result</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-[#141b2d]">{resultTitle}</h2>
          </div>
          <Sparkles className="size-5 text-[#4b41e7]" />
        </div>

        {error ? <ErrorNotice error={error} /> : null}
        {!result && !error ? <EmptyResult /> : null}
        {result?.type === "ats" ? <AtsResultView result={result.data} /> : null}
        {result?.type === "match" ? <MatchResultView result={result.data} /> : null}
      </div>
    </section>
  );
}

function FilePicker({
  label,
  file,
  inputRef,
  onChange,
  onClear,
}: {
  label: string;
  file: File | null;
  inputRef: RefObject<HTMLInputElement | null>;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}) {
  return (
    <Field label={label} hint="PDF atau DOCX, max 5MB">
      <div className="rounded-2xl border border-dashed border-[#cfd8ea] bg-[#fbfcff] p-4 dark:border-slate-700/70 dark:bg-slate-950/35">
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={onChange}
          className="sr-only"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-[#eef2ff] text-[#4b41e7]">
              <Upload className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#141b2d]">
                {file ? file.name : "Choose your CV file"}
              </p>
              <p className="mt-1 text-xs text-[#7a8096]">
                {file ? formatFileSize(file.size) : "Your file is only sent when you analyze."}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {file ? (
              <button
                type="button"
                onClick={onClear}
                className="h-9 rounded-xl border border-[#dbe2f1] px-3 text-xs font-semibold text-[#5c6478] hover:bg-white dark:border-slate-700/70 dark:text-slate-300 dark:hover:bg-slate-800/86"
              >
                Clear
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="h-9 rounded-xl bg-[#4b41e7] px-3 text-xs font-semibold text-white hover:bg-[#3e35d2]"
            >
              Browse
            </button>
          </div>
        </div>
      </div>
    </Field>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-[#273044]">
        {label}
        {hint ? <span className="text-xs font-medium text-[#8b91a7]">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-11 rounded-xl border px-4 text-sm font-semibold transition-colors",
        active
          ? "border-[#4b41e7] bg-[#eef2ff] text-[#4b41e7] dark:border-indigo-300/50 dark:bg-indigo-500/16 dark:text-indigo-200"
          : "border-[#dbe2f1] bg-white text-[#5c6478] hover:bg-[#f8faff] dark:border-slate-700/70 dark:bg-slate-900/78 dark:text-slate-300 dark:hover:bg-slate-800/86",
      )}
    >
      {children}
    </button>
  );
}

function SubmitButton({
  loading,
  disabled,
  children,
}: {
  loading: boolean;
  disabled: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#4b41e7] px-5 text-sm font-bold text-white shadow-[0_18px_40px_-24px_rgba(75,65,231,0.75)] transition-colors hover:bg-[#3e35d2] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
      {loading ? "Analyzing..." : children}
    </button>
  );
}

function EmptyResult() {
  return (
    <div className="flex min-h-[520px] flex-col items-center justify-center rounded-[24px] border border-dashed border-[#d7dff1] bg-[#fbfcff] px-6 text-center dark:border-slate-700/70 dark:bg-slate-950/35">
      <div className="flex size-16 items-center justify-center rounded-[24px] bg-[#eef2ff] text-[#4b41e7]">
        <BadgeCheck className="size-8" />
      </div>
      <p className="mt-5 max-w-sm text-sm leading-7 text-[#687086]">
        Upload CV, pilih tool, lalu jalankan analisis. Ringkasan skor, keyword, dan rekomendasi akan muncul di panel ini.
      </p>
    </div>
  );
}

function ErrorNotice({ error }: { error: ToolError }) {
  return (
    <div
      className={cn(
        "mb-5 rounded-2xl border px-4 py-3 text-sm leading-6",
        error.tone === "warning" && "border-amber-200 bg-amber-50 text-amber-800",
        error.tone === "error" && "border-rose-200 bg-rose-50 text-rose-700",
      )}
    >
      <div className="flex gap-2">
        <AlertCircle className="mt-0.5 size-4 shrink-0" />
        <span>{error.message}</span>
      </div>
    </div>
  );
}

function AtsResultView({ result }: { result: AtsScoreResult }) {
  const sectionScores = [
    ["Structure", result.sections.structure],
    ["ATS compatibility", result.sections.ats_compatibility],
    ["Readability", result.sections.readability],
    ["Keyword match", result.sections.keyword_match],
    ["Impact", result.sections.impact],
  ] as const;

  return (
    <div className="space-y-5">
      <ScoreHeader score={result.score} label={`Grade ${result.grade}`} summary={result.summary} />
      <ScoreBarList items={sectionScores} />
      <KeywordGroups
        positiveTitle="Strengths"
        negativeTitle="Improvements"
        positiveItems={result.strengths}
        negativeItems={result.improvements}
      />
      <KeywordGroups
        positiveTitle="Matched Keywords"
        negativeTitle="Missing Keywords"
        positiveItems={result.matched_keywords}
        negativeItems={result.missing_keywords}
        chipMode
      />
      <FileSummary file={result.file} privacyNote={result.privacy_note} />
    </div>
  );
}

function MatchResultView({ result }: { result: JobMatchResult }) {
  const breakdown = [
    ["Keyword overlap", result.breakdown.keyword_overlap],
    ["Required skills", result.breakdown.required_skills],
    ["Experience signals", result.breakdown.experience_signals],
    ["ATS readiness", result.breakdown.ats_readiness],
  ] as const;

  return (
    <div className="space-y-5">
      <ScoreHeader score={result.match_score} label={result.match_level} summary={result.summary} />
      <JobSummary job={result.job} />
      <ScoreBarList items={breakdown} />
      <KeywordGroups
        positiveTitle="Matched Keywords"
        negativeTitle="Missing Keywords"
        positiveItems={result.matched_keywords}
        negativeItems={result.missing_keywords}
        chipMode
      />
      <KeywordGroups
        positiveTitle="Suggested CV Updates"
        negativeTitle="Focus Gaps"
        positiveItems={result.suggested_cv_updates}
        negativeItems={result.missing_keywords.slice(0, 6)}
      />
      <FileSummary file={result.file} privacyNote={result.privacy_note} />
    </div>
  );
}

function ScoreHeader({
  score,
  label,
  summary,
}: {
  score: number;
  label: string;
  summary: string;
}) {
  return (
    <div className="grid gap-5 rounded-[24px] bg-[#eef2ff] p-5 dark:bg-slate-950/40 sm:grid-cols-[140px_minmax(0,1fr)] sm:items-center">
      <div className="mx-auto flex size-32 items-center justify-center rounded-full bg-[conic-gradient(#4b41e7_var(--score),#dfe5f7_0)] p-2 [--score:0deg]" style={{ "--score": `${Math.max(0, Math.min(100, score)) * 3.6}deg` } as CSSProperties}>
        <div className="flex size-full flex-col items-center justify-center rounded-full bg-white dark:bg-slate-900">
          <span className="text-4xl font-black text-[#141b2d]">{score}</span>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b91a7]">Score</span>
        </div>
      </div>
      <div>
        <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold text-[#4b41e7] dark:bg-slate-900 dark:text-indigo-200">{label}</span>
        <p className="mt-3 text-sm leading-7 text-[#4f5670]">{summary}</p>
      </div>
    </div>
  );
}

function ScoreBarList({ items }: { items: ReadonlyArray<readonly [string, number]> }) {
  return (
    <div className="space-y-3">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-2xl border border-[#edf0f7] bg-white px-4 py-3 dark:border-slate-700/70 dark:bg-slate-950/35">
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span className="font-semibold text-[#273044]">{label}</span>
            <span className="font-bold text-[#4b41e7]">{value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#edf1fb]">
            <div className="h-full rounded-full bg-[#4b41e7]" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function KeywordGroups({
  positiveTitle,
  negativeTitle,
  positiveItems,
  negativeItems,
  chipMode,
}: {
  positiveTitle: string;
  negativeTitle: string;
  positiveItems: string[];
  negativeItems: string[];
  chipMode?: boolean;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ResultList title={positiveTitle} items={positiveItems} tone="positive" chipMode={chipMode} />
      <ResultList title={negativeTitle} items={negativeItems} tone="negative" chipMode={chipMode} />
    </div>
  );
}

function ResultList({
  title,
  items,
  tone,
  chipMode,
}: {
  title: string;
  items: string[];
  tone: "positive" | "negative";
  chipMode?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#edf0f7] bg-white p-4 dark:border-slate-700/70 dark:bg-slate-950/35">
      <h3 className="text-sm font-bold text-[#141b2d]">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-[#8b91a7]">No data yet.</p>
      ) : chipMode ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={item}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold",
                tone === "positive" && "bg-[#eefcf3] text-[#277847] dark:bg-emerald-500/14 dark:text-emerald-200",
                tone === "negative" && "bg-[#fff3eb] text-[#a44100] dark:bg-amber-500/14 dark:text-amber-200",
              )}
            >
              {item}
            </span>
          ))}
        </div>
      ) : (
        <ul className="mt-3 space-y-2 text-sm leading-6 text-[#5c6478]">
          {items.map((item) => (
            <li key={item} className="flex gap-2">
              <span className={cn("mt-2 size-1.5 shrink-0 rounded-full", tone === "positive" ? "bg-emerald-500" : "bg-amber-500")} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function JobSummary({ job }: { job: JobMatchResult["job"] }) {
  if (!job.title && !job.company && !job.id) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-[#edf0f7] bg-white p-4 dark:border-slate-700/70 dark:bg-slate-950/35">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b91a7]">Compared Job</p>
      <h3 className="mt-2 text-lg font-bold text-[#141b2d]">{job.title ?? "Selected job"}</h3>
      <p className="mt-1 text-sm text-[#687086]">
        {[job.company, job.location, job.employment_type, job.work_type, job.category].filter(Boolean).join(" / ")}
      </p>
    </div>
  );
}

function FileSummary({
  file,
  privacyNote,
}: {
  file: AtsScoreResult["file"];
  privacyNote: string;
}) {
  return (
    <div className="rounded-2xl border border-[#edf0f7] bg-[#fbfcff] p-4 text-sm leading-6 text-[#5c6478] dark:border-slate-700/70 dark:bg-slate-950/35">
      <p className="font-semibold text-[#141b2d]">{file.name}</p>
      <p className="mt-1">
        {file.type.toUpperCase()} / {formatFileSize(file.size_bytes)} / {file.extracted_char_count.toLocaleString("en-US")} chars
        {file.text_truncated ? " / text truncated" : ""}
      </p>
      <p className="mt-2 text-xs text-[#7a8096]">{privacyNote || PRIVACY_COPY}</p>
    </div>
  );
}

function validateFile(file: File | null): ToolError | null {
  if (!file) {
    return { tone: "warning", message: "Upload CV terlebih dahulu." };
  }

  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  if (!ACCEPTED_EXTENSIONS.includes(extension)) {
    return { tone: "warning", message: "Format file belum didukung. Gunakan PDF atau DOCX." };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { tone: "warning", message: "Ukuran file maksimal 5MB." };
  }

  return null;
}

function mapToolError(status: number, apiMessage?: string): ToolError {
  if (status === 400) {
    return {
      tone: "warning",
      message: apiMessage || "Data belum valid. Periksa file CV dan target lowongan.",
    };
  }
  if (status === 413) {
    return { tone: "warning", message: "File terlalu besar. Gunakan CV maksimal 5MB." };
  }
  if (status === 429) {
    return { tone: "warning", message: "Terlalu banyak request. Coba lagi nanti." };
  }
  if (status === 403) {
    return {
      tone: "error",
      message: "Frontend origin belum masuk CORS allowlist backend.",
    };
  }

  return {
    tone: "error",
    message: "Analisis belum bisa diproses. Coba lagi beberapa saat lagi.",
  };
}

function trackToolCompleted(tool: ActiveTool, data: unknown) {
  void trackEvent({
    event_name: "career_tool_completed",
    path: tool === "ats" ? "/career-tools/ats-score" : "/career-tools/job-match",
    metadata: {
      tool: tool === "ats" ? "ats_score" : "job_match",
      score: readToolScore(data),
    },
  });
}

function trackToolFailed(tool: ActiveTool, status?: number, reason?: string) {
  void trackEvent({
    event_name: "career_tool_failed",
    path: tool === "ats" ? "/career-tools/ats-score" : "/career-tools/job-match",
    metadata: {
      tool: tool === "ats" ? "ats_score" : "job_match",
      status,
      reason: reason ?? (status ? mapToolFailureReason(status) : "unknown_error"),
    },
  });
}

function readToolScore(data: unknown) {
  if (!data || typeof data !== "object") {
    return undefined;
  }

  const candidate = data as { score?: unknown; match_score?: unknown };
  if (typeof candidate.score === "number") {
    return candidate.score;
  }
  if (typeof candidate.match_score === "number") {
    return candidate.match_score;
  }

  return undefined;
}

function mapToolFailureReason(status: number) {
  if (status === 400) return "validation_error";
  if (status === 403) return "cors_forbidden";
  if (status === 413) return "file_too_large";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "server_error";
  return "request_failed";
}

function getFileExtension(fileName: string) {
  const extension = fileName.slice(fileName.lastIndexOf(".") + 1).toLowerCase();
  return extension || "unknown";
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024)).toLocaleString("en-US")} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
