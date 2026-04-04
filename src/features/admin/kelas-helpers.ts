import type { AdminCreateCourseRequest, CourseMeeting, CourseTrackType, Level } from "@/lib/api-types";

export const SD_SMP_SMA_SLUGS = ["sd", "smp", "sma"];

export function filterLevelsSDSMPSMA(levels: Level[]): Level[] {
  const bySlug = new Map<string, Level>();
  levels.forEach((l) => {
    const slug = (l.slug ?? "").toLowerCase().trim();
    if (SD_SMP_SMA_SLUGS.includes(slug)) bySlug.set(slug, l);
  });
  return SD_SMP_SMA_SLUGS.map((s) => bySlug.get(s)).filter(Boolean) as Level[];
}

export function defaultMeetingsForForm(): CourseMeeting[] {
  return Array.from({ length: 8 }, (_, i) => ({
    meetingNumber: i + 1,
    title: "",
    detailText: "",
    pdfUrl: "",
    prTitle: "",
    prDescription: "",
    liveClassUrl: "",
  }));
}

export function parseTryoutIdLines(text: string): string[] {
  return text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export type ModuleFormState = {
  title: string;
  description: string;
  trackType: CourseTrackType;
  pretestTryoutSessionId: string;
  linkedTryoutIdsText: string;
  meetings: CourseMeeting[];
};

export function emptyModuleForm(): ModuleFormState {
  return {
    title: "",
    description: "",
    trackType: "meetings",
    pretestTryoutSessionId: "",
    linkedTryoutIdsText: "",
    meetings: defaultMeetingsForForm(),
  };
}

export function buildOptionalProgramOnCreate(
  form: ModuleFormState
): Partial<
  Pick<AdminCreateCourseRequest, "trackType" | "meetings" | "pretestTryoutSessionId" | "linkedTryoutIds">
> | null {
  const linkedIds = parseTryoutIdLines(form.linkedTryoutIdsText);
  const hasMeetingAny = form.meetings.some((m) =>
    [m.title, m.detailText, m.pdfUrl, m.prTitle, m.prDescription, m.liveClassUrl].some(
      (v) => String(v ?? "").trim() !== ""
    )
  );
  const pret = form.pretestTryoutSessionId.trim();
  const shouldSync =
    hasMeetingAny || pret !== "" || form.trackType === "tryout" || linkedIds.length > 0;
  if (!shouldSync) return null;
  const out: Partial<
    Pick<AdminCreateCourseRequest, "trackType" | "meetings" | "pretestTryoutSessionId" | "linkedTryoutIds">
  > = {
    trackType: form.trackType,
    meetings: form.trackType === "meetings" ? form.meetings : [],
  };
  if (pret) out.pretestTryoutSessionId = pret;
  if (form.trackType === "tryout" && linkedIds.length > 0) out.linkedTryoutIds = linkedIds;
  return out;
}
