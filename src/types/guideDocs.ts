// The test-user guide: markdown files with a small front matter, shown on the Guide page.
// Pure helpers only (parsing, order, headings, the researcher part), so they can be tested.

export interface GuideMeta {
  id: string; // "start", "ts-01" ...
  title: string; // the H1, e.g. "Test Scenario 01 — Settings - Studies & Programs"
  short: string; // the sidebar label
  order: number;
  page?: string; // the page of the app
  role?: string;
  goal?: string;
  minutes?: string;
  needs?: string; // the precondition
  persists?: string; // what is saved and what is lost on a reload
}

export interface GuideDoc extends GuideMeta {
  body: string; // the markdown the participant reads
  researcher: string; // the part under "## For the researcher" (empty when there is none)
}

const RESEARCHER = /^##\s+For the researcher\s*$/im;

// `---\nkey: value\n---` at the top, then the markdown
export const parseGuideDoc = (raw: string, fallbackId: string): GuideDoc => {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  const front: Record<string, string> = {};
  const content = match ? match[2] : raw;
  if (match) {
    match[1].split(/\r?\n/).forEach((line) => {
      const i = line.indexOf(":");
      if (i > 0) front[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    });
  }
  const split = content.search(RESEARCHER);
  const body = (split >= 0 ? content.slice(0, split) : content).trim();
  const researcher = split >= 0 ? content.slice(split).replace(RESEARCHER, "").trim() : "";
  const id = front.id || fallbackId;
  return {
    id,
    title: front.title || id,
    short: front.short || front.title || id,
    order: front.order !== undefined && front.order !== "" && Number.isFinite(Number(front.order)) ? Number(front.order) : 99,
    page: front.page,
    role: front.role,
    goal: front.goal,
    minutes: front.minutes,
    needs: front.needs,
    persists: front.persists,
    body,
    researcher,
  };
};

export const sortGuideDocs = (docs: GuideDoc[]): GuideDoc[] => [...docs].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));

// The previous and next page of the guide
export const neighbours = (docs: GuideDoc[], id: string): { prev?: GuideDoc; next?: GuideDoc } => {
  const i = docs.findIndex((d) => d.id === id);
  return i < 0 ? {} : { prev: docs[i - 1], next: docs[i + 1] };
};

export interface GuideHeading {
  level: 2 | 3;
  text: string;
  slug: string;
}

export const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

// The "On this page" list: the ## and ### headings, outside code blocks
export const guideHeadings = (markdown: string): GuideHeading[] => {
  let inCode = false;
  const out: GuideHeading[] = [];
  markdown.split(/\r?\n/).forEach((line) => {
    if (/^```/.test(line)) inCode = !inCode;
    if (inCode) return;
    const m = line.match(/^(##|###)\s+(.+?)\s*$/);
    if (m) out.push({ level: m[1].length === 2 ? 2 : 3, text: m[2], slug: slugify(m[2]) });
  });
  return out;
};

// `#/guide/ts-03` ↔ the id of a page ("" = the first page)
export const GUIDE_ROOT = "#/guide";
export const parseGuideHash = (hash: string): string | null => {
  const m = hash.match(/^#\/guide(?:\/([\w-]+))?\/?$/);
  return m ? (m[1] ?? "") : null;
};
export const formatGuideHash = (id: string) => (id ? `${GUIDE_ROOT}/${id}` : GUIDE_ROOT);

// Every image a guide page uses, to check that the files exist
export const guideImages = (markdown: string): string[] => [...markdown.matchAll(/!\[[^\]]*\]\(([^)\s]+)\)/g)].map((m) => m[1]);
