import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

const noteImages = import.meta.glob("../../master-data/assets/*", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const imageByFilename = new Map(
  Object.entries(noteImages).map(([path, url]) => [path.split("/").pop(), url]),
);

function resolveNoteImage(src?: string) {
  if (!src) return src;

  try {
    const pathname = src.startsWith("http") ? new URL(src).pathname : src;
    const filename = decodeURIComponent(pathname.split("/").pop() ?? "");
    return imageByFilename.get(filename) ?? src;
  } catch {
    return src;
  }
}

export function Markdown({ children }: { children: string }) {
  return (
    <div className="note-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          img: ({ src, alt }) => (
            <img src={resolveNoteImage(src)} alt={alt ?? ""} loading="lazy" />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
