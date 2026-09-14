import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { formatDate, getCategory, readingTime } from "@/lib/notes";
import { profile } from "@/lib/profile";

export const Route = createFileRoute("/notes/$category/")({
  loader: ({ params }) => {
    const category = getCategory(params.category);
    if (!category) throw notFound();
    return { name: category.name, count: category.notes.length };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Subject not found" }, { name: "robots", content: "noindex" }],
      };
    }
    const title = `${loaderData.name} notes — ${profile.name}`;
    const description = `${loaderData.count} reading notes on ${loaderData.name}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { category: slug } = Route.useParams();
  const category = getCategory(slug);
  if (!category) return null;

  return (
    <div className="mx-auto max-w-3xl px-6">
      <header className="border-b border-rule py-16">
        <Link to="/notes" className="label hover:text-accent">
          ← All notes
        </Link>
        <h1 className="mt-4 text-3xl tracking-tight">{category.name}</h1>
        <p className="label mt-2">
          {category.notes.length} {category.notes.length === 1 ? "note" : "notes"}
        </p>
      </header>

      <ul className="divide-y divide-rule">
        {category.notes.map((note) => (
          <li key={note.slug} className="py-8">
            <Link
              to="/notes/$category/$slug"
              params={{ category: note.categorySlug, slug: note.slug }}
              className="group block"
            >
              <span className="block text-xl tracking-tight group-hover:text-accent">
                {note.title}
              </span>
              <span className="label mt-1 block">
                {[note.author, formatDate(note.date), note.status, readingTime(note.wordCount)]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
              {note.description ? (
                <span className="mt-2 block text-muted-foreground">{note.description}</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
