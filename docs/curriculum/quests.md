# Weekly quests — ideas for the game layer

Quests are **optional side goals for one calendar week**: Monday 00:00 → Sunday 23:59 in the student's time zone.
They reward the behaviours the program is built on: showing up, shipping, sharing, reflecting, helping and reading
around the topic. They never reward grinding.

## Design rules (pedagogy)

1. **Every quest is achievable inside the normal plan.** A student following the program at 1–2 hours a day should
   finish at least one quest a week without extra work. No quest requires more than about 30 extra minutes.
2. **Measure real events only.** Rules use events the platform already records:
   - `task.completed` (with task `type`, `day`, `xp`, `proof`);
   - `day.completed`;
   - streak and freeze state;
   - `resource.viewed`;
   - `studio.rendered`.

   No quest depends on things we can't verify, such as follower counts.
3. **Offer three a week, and two are enough to finish the week.** The student picks. Rotation keeps it fresh.
4. **Rewards are small:** 30–60 XP each, a little under one task's worth. They mustn't distort leaderboards, so a
   quest is never worth more than a boss task.
5. **Rest stays rest.** No quest asks for activity on the student's rest day, and "do X on 7 different days" quests
   don't exist.
6. **Week-aware:** a quest can be limited to program weeks (`weeks: [1,2]` means program days 1–14), so it fits what
   the student is learning.

Fields: `id` · `track` (common / apps / video) · `weeks` (program weeks it may appear in, 1–10) · `rule` (evaluated over
this calendar week's events) · `target` · `xp`.

---

## Shared quests (both tracks)

| id | Title (EN / RU) | What the student does | Rule | Target | XP | Weeks |
|---|---|---|---|---|---|---|
| q-five-of-seven | Five of seven / Пять из семи | Show up on five different days | distinct local dates with ≥1 `task.completed` | 5 | 50 | all |
| q-say-it-out-loud | Say it out loud / Скажи вслух | Complete share tasks: post your work, send a link | `task.completed` where type = share | 2 | 40 | all |
| q-honest-mirror | The honest mirror / Честное зеркало | Write reflections of 40+ words, not one-liners | `task.completed` where type = reflect and proof text ≥ 40 words | 3 | 40 | all |
| q-reader | Read around it / Почитай вокруг | Open and mark done library resources linked from this week's days | `resource.viewed` (marked done) for resources mapped to days the student did this week | 2 | 40 | all |
| q-perfect-boss | Boss without shortcuts / Босс без поблажек | Finish a boss day with every task's proof submitted | `day.completed` where boss = true and every task has proof ≠ none | 1 | 60 | 2, 4, 6, 8, 10 |

## Apps track

| id | Title (EN / RU) | What the student does | Rule | Target | XP | Weeks |
|---|---|---|---|---|---|---|
| q-apps-ship-twice | Ship it twice / Выпусти дважды | Two live links this week: a deploy, a bot, a PR | `task.completed` where type = ship and proof = link | 2 | 50 | 3–10 |
| q-apps-first-users | Three humans / Три живых человека | Get real people to try the thing (apps 20, 27, 54) | ship/share tasks whose proof text mentions ≥3 people, or task ids d20-apps-t4, d27-apps-t2, d54-apps-t1 | 1 | 50 | 3, 4, 8 |
| q-apps-model-taster | Model taster / Дегустатор моделей | Try a second model provider in your app or arena | task d22-apps-t2 or d22-apps-t3 completed with a link | 1 | 40 | 4 |
| q-apps-green-ci | Green build / Зелёная сборка | Paste links to a passing CI run on two days | `task.completed` d29-apps-t3, or any build task whose link matches `github.com/.*/actions/runs/` | 2 | 40 | 5–10 |
| q-apps-bug-squasher | Bug squasher / Охотник за багами | Fix real feedback items (apps 37, 54) | tasks d37-apps-t3, d54-apps-t2, d64-apps-t1 with PR links | 1 | 50 | 6, 8, 10 |
| q-apps-safe-keys | Keys stay home / Ключи — дома | Finish the security/cost tasks of the week | tasks d33-apps-t2…t4 completed | 3 | 40 | 5 |
| q-apps-bot-life | Bot on duty / Бот на смене | Bot tasks done and the bot linked as proof | tasks d19-apps-t2…t3 and d20-apps-t3 with a `t.me/` link | 3 | 50 | 3 |
| q-apps-explain-the-diff | Read the diff / Прочитай дифф | Review an agent PR like a senior (apps 38) and leave 3 comments | task d38-apps-t3 with proof text ≥ 3 lines | 1 | 40 | 6 |
| q-apps-launch-crew | Launch crew / Команда запуска | Prepare the launch kit and send one pitch the same week | tasks d62-apps-t1 and d60-t2 completed | 2 | 60 | 9–10 |
| q-apps-helper | Pay it forward / Помоги новичку | Answer a newer student's question (day 42), plus one extra share | d42-t1 + 1 share task | 2 | 40 | 6 |

## Video track

| id | Title (EN / RU) | What the student does | Rule | Target | XP | Weeks |
|---|---|---|---|---|---|---|
| q-video-three-renders | Three renders / Три рендера | Upload rendered mp4 proofs this week | `task.completed` where proof = file and the file is a video | 3 | 50 | 3–10 |
| q-video-studio-spin | Studio spin / Круг по Студии | Render something in the built-in Studio | `studio.rendered` | 1 | 40 | 3–10 |
| q-video-hook-battle | Hook battle / Битва крючков | Make three hook variants and publish the winner (video 24, 31) | tasks d24-video-t2 + d24-video-t3, or d31-video-t3 | 2 | 50 | 4, 5 |
| q-video-loud-enough | −14 LUFS club / Клуб −14 LUFS | Finish the sound tasks and the QC-gate tasks | tasks d20-video-t2 or d47-video-t2 completed | 1 | 40 | 3, 7 |
| q-video-captions-on | Captions on / Субтитры включены | Captions done and a captioned video published | d23-video-t3 + any ship/share with a link in the same week | 2 | 50 | 4 |
| q-video-one-command | One command / Одной командой | The pipeline runs end to end, twice, on different topics | tasks d33-video-t2 and d34-video-t2 completed | 2 | 60 | 5 |
| q-video-publish-week | Publishing week / Неделя публикаций | Two public links to published videos | ship/share tasks with links on youtube.com, youtu.be, vk.com, vkvideo.ru, rutube.ru or t.me | 2 | 50 | 6–10 |
| q-video-numbers | Read the numbers / Смотри на цифры | Retention notes plus a re-cut uploaded (video 37) | tasks d37-video-t2 and d37-video-t3 completed | 2 | 40 | 6 |
| q-video-two-languages | Two voices / Два голоса | The dubbing day, plus sharing both versions | d45-video-t2 + 1 share task | 2 | 50 | 7 |
| q-video-client-ready | Client-ready / Готово для клиента | Ship the client pack and write the case study (video 41) | tasks d41-video-t2 and d41-video-t4 completed | 2 | 60 | 6 |

## Copy (ready for the UI)

Short descriptions, written natively. Use them as the quest card's subtitle.

| id | EN | RU |
|---|---|---|
| q-five-of-seven | Show up on any five days this week. Rest days are yours. | Появись в любые пять дней этой недели. Дни отдыха — твои. |
| q-say-it-out-loud | Post your work twice. Building in public is a skill too. | Дважды покажи свою работу. Строить публично — тоже навык. |
| q-honest-mirror | Three reflections, 40 words or more. Future you will thank you. | Три рефлексии по 40+ слов. Ты через месяц скажешь спасибо. |
| q-reader | Finish two library resources from this week's days. | Пройди два материала библиотеки из дней этой недели. |
| q-perfect-boss | Beat this week's boss with proof on every task. | Пройди босса недели с доказательством в каждом задании. |
| q-apps-ship-twice | Two live links this week: a deploy, a bot, a merged PR. | Две живые ссылки за неделю: деплой, бот или влитый PR. |
| q-apps-first-users | Put your app in front of three real people. | Покажи приложение трём живым людям. |
| q-apps-model-taster | Try one more model provider and compare honestly. | Попробуй ещё одного провайдера моделей и честно сравни. |
| q-apps-green-ci | Two green CI runs. Tests that pass are tests that count. | Два зелёных прогона CI. Считаются только тесты, которые проходят. |
| q-apps-bug-squasher | Turn real feedback into a merged fix. | Преврати живой отзыв во влитое исправление. |
| q-apps-safe-keys | Lock down keys, limits and spend caps this week. | Закрой ключи, лимиты и потолок трат на этой неделе. |
| q-apps-bot-life | Your bot is live and answering. Prove it with a t.me link. | Бот работает и отвечает. Докажи ссылкой t.me. |
| q-apps-explain-the-diff | Review an agent's PR like a senior: three real comments. | Сделай ревью PR агента как сеньор: три настоящих комментария. |
| q-apps-launch-crew | Launch kit ready and one pitch sent — same week. | Набор к запуску готов и один отклик отправлен — за одну неделю. |
| q-apps-helper | Help a newer student and share what you learned. | Помоги новичку и поделись тем, чему научился сам. |
| q-video-three-renders | Three finished renders uploaded this week. | Три готовых рендера за неделю. |
| q-video-studio-spin | Make one video in the built-in Studio. | Сделай одно видео во встроенной Студии. |
| q-video-hook-battle | Three hooks enter, one gets published. | Три крючка выходят на ринг, публикуется один. |
| q-video-loud-enough | Hit −14 LUFS and pass your own QC gate. | Попади в −14 LUFS и пройди свой контроль качества. |
| q-video-captions-on | Burn in captions and publish the captioned cut. | Вшей субтитры и опубликуй версию с ними. |
| q-video-one-command | Two topics, one command, two finished videos. | Две темы, одна команда — два готовых ролика. |
| q-video-publish-week | Two videos out in public this week. | Два ролика в открытом доступе за неделю. |
| q-video-numbers | Read the retention curve and re-cut the opening. | Посмотри на удержание и перемонтируй начало. |
| q-video-two-languages | One video, two languages — share both. | Один ролик, два языка — поделись обоими. |
| q-video-client-ready | Deliver the client pack and write the case study. | Сдай клиенту пакет роликов и напиши кейс. |

## Rotation suggestion

- Each Monday, pick three quests for the student's track and current program week (`weeks` filter):
  - one shared quest;
  - two track quests;
  - never the same quest two weeks running.
- **Week 1:** only shared quests. q-five-of-seven, q-say-it-out-loud and q-honest-mirror are the onboarding set.
- **Catching up:** if a student is behind, prefer q-five-of-seven and q-reader. They reward returning, not speed.
