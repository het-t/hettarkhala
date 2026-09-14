// Auto-discovers every markdown file inside master-data/<Category>/*.md
// Add, rename, or delete files/folders and the site follows — no code changes.

const modules = import.meta.glob("../../master-data/**/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

export type Note = {
  slug: string;
  category: string;
  categorySlug: string;
  title: string;
  author?: string;
  date?: string;
  status?: string;
  description?: string;
  content: string;
  wordCount: number;
};

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleize(value: string): string {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseFrontmatter(raw: string): { data: Record<string, string>; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
  if (!match) return { data: {}, body: raw };
  const data: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line
      .slice(idx + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    if (key) data[key] = value;
  }
  return { data, body: raw.slice(match[0].length) };
}

function build(): Note[] {
  const notes: Note[] = [];

  for (const [path, raw] of Object.entries(modules)) {
    const rel = path.split("master-data/")[1];
    if (!rel) continue;
    const segments = rel.split("/");
    // Files directly inside master-data/ (like README.md) are not notes.
    if (segments.length < 2) continue;

    const fileName = segments[segments.length - 1].replace(/\.md$/i, "");
    const category = titleize(segments.slice(0, -1).join(" / "));
    const { data, body } = parseFrontmatter(raw);

    notes.push({
      slug: slugify(fileName),
      category,
      categorySlug: slugify(segments[0]),
      title: data.title || titleize(fileName),
      author: data.author,
      date: data.date,
      status: data.status,
      description: data.description,
      content: body.trim(),
      wordCount: body.trim().split(/\s+/).filter(Boolean).length,
    });
  }

  return notes.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

export const notes: Note[] = build();

export type Category = {
  name: string;
  slug: string;
  notes: Note[];
};

export const categories: Category[] = (() => {
  const map = new Map<string, Category>();
  for (const note of notes) {
    let entry = map.get(note.categorySlug);
    if (!entry) {
      entry = { name: note.category, slug: note.categorySlug, notes: [] };
      map.set(note.categorySlug, entry);
    }
    entry.notes.push(note);
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
})();

export function getCategory(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getNote(categorySlug: string, slug: string): Note | undefined {
  return notes.find((n) => n.categorySlug === categorySlug && n.slug === slug);
}

export function formatDate(value?: string): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function readingTime(words: number): string {
  return `${Math.max(1, Math.round(words / 220))} min read`;
}
