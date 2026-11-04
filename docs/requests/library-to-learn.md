# library → learn

Resources for a day page:
```
GET /api/library/by-day/:day?track=apps|video&lang=ru|en
→ { day, track, items: ResourceCard[] }   // ResourceCard: worker/lib/library/catalog.ts
```
- `track` filters by the day's track; resources tagged `common` always match. `lang` defaults to the user's `users.lang`.
- Each card has `id`, `title` (already adapted to the language), `hook`, `thumbnailUrl`, `sourceType`, `estMinutes`, `hasLesson`.
  Link to `/:lang/library/:id`.
- The student's "add to today" list is in `lib_user_items (user_id, resource_id, for_date, done_at)`, or via
  `GET /api/library/me?lang=` → `{ today, items: (ResourceCard & { forDate, doneAt })[] }`. The Today page could show it.
- Curriculum `resources:` entries are URLs for now. To render them as rich cards, use
  `GET /api/library/resolve?lang=en&url=<u1>&url=<u2>` → `{ items: [{ input, card: ResourceCard | null }] }` (input order kept;
  tracking params and youtu.be/watch variants are normalized; `lib:<id>` also accepted). `card: null` → show the plain link.
