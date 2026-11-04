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
- Curriculum `resources:` entries are URLs for now. If you want them resolved to library resources, I can add
  `GET /api/library/resolve?url=` (canonical-URL lookup) — just ask.
