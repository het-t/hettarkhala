import { createFileRoute, Link } from "@tanstack/react-router";

import { categories, formatDate, notes } from "@/lib/notes";
import { profile } from "@/lib/profile";

export const Route = createFileRoute("/notes/")({
  head: () => ({
    meta: [
      { title: `Notes — ${profile.name}` },
      {
        name: "description",
        content:
          "An open notebook: reading notes organised by subject, written while working through books.",
      },
      { property: "og:title", content: `Notes — ${profile.name}` },
      {
        property: "og:description",
        content: "Reading notes organised by subject, kept in the open.",
      },
    ],
  }),
  component: NotesIndex,
});

function NotesIndex() {
  return (
    <div className="mx-auto max-w-3xl px-6">
      <header className="border-b border-rule py-16">
        <p className="label">Open notebook</p>
        <h1 className="mt-4 text-3xl tracking-tight">Notes</h1>
        <p className="mt-4 max-w-xl text-[1.0625rem] leading-relaxed text-muted-foreground">
          {notes.length} notes across {categories.length} subjects. Everything here is written
          while reading, then trimmed to what still holds up.
        </p>
      </header>

      {categories.length === 0 ? (
        <p className="py-16 text-muted-foreground">
          No notes yet — add a markdown file inside a subfolder of <code>master-data/</code>.
        </p>
      ) : (
        categories.map((category) => (
          <section
            key={category.slug}
            className="grid gap-8 border-b border-rule py-12 sm:grid-cols-[10rem_1fr]"
          >
            <div>
              <Link to="/notes/$category" params={{ category: category.slug }} className="label hover:text-accent">
                {category.name}
              </Link>
              <p className="mt-1 font-mono text-[0.6875rem] text-muted-foreground">
                {category.notes.length} {category.notes.length === 1 ? "note" : "notes"}
              </p>
            </div>
            <ul className="space-y-5">
              {category.notes.map((note) => (
                <li key={note.slug}>
                  <Link
                    to="/notes/$category/$slug"
                    params={{ category: note.categorySlug, slug: note.slug }}
                    className="group block"
                  >
                    <span className="block text-lg tracking-tight text-foreground group-hover:text-accent">
                      {note.title}
                    </span>
                    <span className="label mt-0.5 block">
                      {[note.author, formatDate(note.date), note.status]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                    {note.description ? (
                      <span className="mt-1 block text-muted-foreground">{note.description}</span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
