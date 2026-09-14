import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { Markdown } from "@/components/markdown";
import { formatDate, getCategory, getNote, readingTime } from "@/lib/notes";
import { profile } from "@/lib/profile";

export const Route = createFileRoute("/notes/$category/$slug")({
  loader: ({ params }) => {
    const note = getNote(params.category, params.slug);
    if (!note) throw notFound();
    return {
      title: note.title,
      description: note.description ?? `Reading notes on ${note.title}.`,
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Note not found" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.title} — notes by ${profile.name}`;
    return {
      meta: [
        { title },
        { name: "description", content: loaderData.description.slice(0, 155) },
        { property: "og:title", content: title },
        { property: "og:description", content: loaderData.description.slice(0, 155) },
        { property: "og:type", content: "article" },
      ],
    };
  },
  component: NotePage,
});

function NotePage() {
  const { category: categorySlug, slug } = Route.useParams();
  const note = getNote(categorySlug, slug);
  const category = getCategory(categorySlug);
  if (!note || !category) return null;

  const siblings = category.notes.filter((n) => n.slug !== note.slug).slice(0, 3);

  return (
    <article className="mx-auto max-w-3xl px-6">
      <header className="border-b border-rule py-16">
        <Link to="/notes/$category" params={{ category: categorySlug }} className="label hover:text-accent">
          ← {category.name}
        </Link>
        <h1 className="mt-4 text-3xl leading-tight tracking-tight">{note.title}</h1>
        <p className="label mt-3">
          {[note.author, formatDate(note.date), note.status, readingTime(note.wordCount)]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {note.description ? (
          <p className="mt-4 max-w-xl text-[1.0625rem] leading-relaxed text-muted-foreground">
            {note.description}
          </p>
        ) : null}
      </header>

      <div className="py-12">
        <Markdown>{note.content}</Markdown>
      </div>

      {siblings.length > 0 ? (
        <nav className="border-t border-rule py-10">
          <p className="label">More in {category.name}</p>
          <ul className="mt-4 space-y-3">
            {siblings.map((s) => (
              <li key={s.slug}>
                <Link
                  to="/notes/$category/$slug"
                  params={{ category: s.categorySlug, slug: s.slug }}
                  className="link-quiet text-foreground"
                >
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </article>
  );
}
