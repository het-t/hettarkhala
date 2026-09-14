import { createFileRoute, Link } from "@tanstack/react-router";

import { profile } from "@/lib/profile";
import { categories, formatDate, notes } from "@/lib/notes";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${profile.name} — ${profile.role}, reading notes` },
      { name: "description", content: profile.summary.slice(0, 155) },
      { property: "og:title", content: `${profile.name} — ${profile.role}` },
      { property: "og:description", content: profile.summary.slice(0, 155) },
    ],
  }),
  component: Index,
});

function Index() {
  const recent = notes.slice(0, 4);
  const finished = notes.filter((n) => n.status === "finished").length;

  return (
    <div className="mx-auto max-w-3xl px-6">
      <section className="border-b border-rule py-20">
        <p className="label">{profile.role}</p>
        <h1 className="mt-5 max-w-2xl text-3xl leading-tight tracking-tight text-foreground sm:text-4xl">
          {profile.tagline}
        </h1>
        <p className="mt-6 max-w-xl text-[1.0625rem] leading-relaxed text-muted-foreground">
          {profile.summary}
        </p>
        <div className="mt-8 flex flex-wrap gap-6">
          <Link to="/notes" className="link-quiet text-foreground">
            Read the notes
          </Link>
          {profile.links.map((l) => (
            <a key={l.label} href={l.href} className="link-quiet text-muted-foreground">
              {l.label}
            </a>
          ))}
        </div>
      </section>

      <section className="grid gap-10 border-b border-rule py-14 sm:grid-cols-[10rem_1fr]">
        <p className="label pt-1">Now</p>
        <ul className="space-y-3">
          {profile.now.map((item) => (
            <li key={item} className="text-[1.0625rem] leading-relaxed text-foreground">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-10 border-b border-rule py-14 sm:grid-cols-[10rem_1fr]">
        <p className="label pt-1">In numbers</p>
        <dl className="grid grid-cols-3 gap-6">
          <div>
            <dt className="label">Notes</dt>
            <dd className="mt-1 text-2xl tracking-tight">{notes.length}</dd>
          </div>
          <div>
            <dt className="label">Subjects</dt>
            <dd className="mt-1 text-2xl tracking-tight">{categories.length}</dd>
          </div>
          <div>
            <dt className="label">Finished</dt>
            <dd className="mt-1 text-2xl tracking-tight">{finished}</dd>
          </div>
        </dl>
      </section>

      <section className="grid gap-10 py-14 sm:grid-cols-[10rem_1fr]">
        <p className="label pt-1">Latest notes</p>
        <ul className="space-y-6">
          {recent.map((note) => (
            <li key={`${note.categorySlug}/${note.slug}`}>
              <Link
                to="/notes/$category/$slug"
                params={{ category: note.categorySlug, slug: note.slug }}
                className="group block"
              >
                <span className="label">
                  {note.category}
                  {note.date ? ` · ${formatDate(note.date)}` : ""}
                </span>
                <span className="mt-1 block text-xl tracking-tight text-foreground group-hover:text-accent">
                  {note.title}
                </span>
                {note.description ? (
                  <span className="mt-1 block text-muted-foreground">{note.description}</span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
