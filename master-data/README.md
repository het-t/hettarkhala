---
title: How this folder works
description: Drop markdown files into subfolders; the site picks them up automatically.
---

Each **subfolder** of `master-data/` becomes a category in the site navigation.
Each `.md` file inside becomes a note page.

Optional frontmatter at the top of a file:

```
---
title: Thinking in Systems
author: Donella Meadows
date: 2026-02-11
status: reading
description: One-line summary shown in listings.
---
```

Nothing else to configure — add, rename, or delete files and the site follows.
