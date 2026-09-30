<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Render note mathematics with remark-math and KaTeX so Markdown source remains portable and readable.
- Resolve note images from bundled `master-data/assets` by filename so they work in previews and GitHub Pages.
- Use simple hyphens instead of em dashes in all user-facing text for consistent punctuation.
- Notes whose frontmatter status is "reading"/in-progress/draft are hidden site-wide (filtered in src/lib/notes.ts); only finished/completed notes are published.
