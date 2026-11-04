import { useState, type ReactNode } from "react";
import { BookOpen, Flame, Plus, Sparkles, Star, Zap, ArrowRight, Video, Code2 } from "lucide-react";
import { useStrings } from "@web/i18n";
import {
  Avatar, Badge, Button, Card, CardHeader, Checkbox, Chip, Dialog, Divider, EmptyState, Field, Input, Kbd, LangSwitcher,
  Markdown, PageHeader, ProgressBar, ProgressRing, Segmented, Select, Sheet, Skeleton, SkeletonCard, SkeletonText, Stat,
  Switch, Tabs, Textarea, ThemeToggle, Tooltip, useToast, Logo, LeafMark, uiStrings, AiNotice,
} from "./index";
import { ShareCard, ShareDialog } from "./ShareCard";

/**
 * Living style guide for the UI kit. Not routed by default — the orchestrator wires `/:lang/ui` → <Showcase />.
 */
const S = {
  en: {
    eyebrow: "Design system", title: "FlowLeaf UI kit", desc: "Every component, in both themes. Import from @web/ui.",
    buttons: "Buttons", forms: "Forms", feedback: "Feedback", data: "Progress & stats", overlays: "Overlays", nav: "Navigation",
    share: "Share card", openShare: "Open share dialog", shareTitle: "Taste both tracks, then choose",
    content: "Content", empty: "Empty & loading", colors: "Color tokens", type: "Type scale",
    startDay: "Start Day 12", continue: "Continue", preview: "Preview", skip: "Skip for today", claim: "Claim 50 XP", del: "Delete draft",
    link: "Link to your app", linkHint: "Any public URL — GitHub Pages, Vercel, a Telegram bot.", linkErr: "This doesn't look like a link yet.",
    note: "What did you build today?", notePh: "Two or three sentences are enough.", track: "Track", apps: "Apps", video: "Video",
    task1: "Deploy your page", task1d: "Publish it and paste the link below", task2: "Post a screenshot in the community",
    reminders: "Daily reminder", dayStreak: "day streak", xp: "XP this week", level: "Level", done: "days done",
    toastOk: "Saved", toastOkD: "Your proof is in. Nice work.", toastXp: "+40 XP", toastXpD: "Task complete — streak is safe.",
    toastErr: "Couldn't upload", toastErrD: "Check your connection and try again.",
    openDialog: "Open dialog", openSheet: "Open sheet", dTitle: "Finish Day 12?", dDesc: "You've completed 3 of 4 tasks. The last one is optional.",
    dBody: "Finishing the day locks in your streak and unlocks Day 13. You can come back and add proof any time.",
    cancel: "Not yet", finish: "Finish day", sTitle: "Filters",
    tabs: { lesson: "Lesson", tasks: "Tasks", notes: "Notes" }, tabLesson: "Today you'll turn a single prompt into a working page.",
    tabTasks: "Four short tasks, about 70 minutes.", tabNotes: "Your private notes for this day.",
    emptyT: "No saved resources yet", emptyD: "Tap the bookmark on any video or article in the library and it will show up here.",
    browse: "Browse library", tip: "Streak freezes protect one missed day.",
    md: `## Your first deploy\n\nToday you'll take the page you built yesterday and put it **on the internet**. It takes about *ten minutes*.\n\n1. Open your project and ask the agent: \`deploy this to Cloudflare Pages\`\n2. Follow the steps it prints\n3. Paste the link into the task below\n\n> [!TIP] If something fails, copy the full error into the chat. The agent is good at reading errors — better than most people.\n\n\`\`\`bash\nnpx wrangler pages deploy ./dist\n\`\`\`\n\nRead more in the [Cloudflare docs](https://developers.cloudflare.com/pages/).`,
  },
  ru: {
    eyebrow: "Дизайн-система", title: "UI-кит FlowLeaf", desc: "Все компоненты в обеих темах. Импорт из @web/ui.",
    buttons: "Кнопки", forms: "Формы", feedback: "Обратная связь", data: "Прогресс и статистика", overlays: "Окна", nav: "Навигация",
    share: "Карточка для соцсетей", openShare: "Открыть окно «Поделиться»", shareTitle: "Попробуй оба трека и выбери свой",
    content: "Контент", empty: "Пусто и загрузка", colors: "Цветовые токены", type: "Шкала шрифтов",
    startDay: "Начать день 12", continue: "Продолжить", preview: "Посмотреть", skip: "Пропустить сегодня", claim: "Забрать 50 XP", del: "Удалить черновик",
    link: "Ссылка на твоё приложение", linkHint: "Любой публичный адрес — GitHub Pages, Vercel, Telegram-бот.", linkErr: "Пока не похоже на ссылку.",
    note: "Что ты сегодня сделал?", notePh: "Хватит двух-трёх предложений.", track: "Трек", apps: "Приложения", video: "Видео",
    task1: "Задеплой страницу", task1d: "Опубликуй и вставь ссылку ниже", task2: "Покажи скриншот в сообществе",
    reminders: "Напоминание каждый день", dayStreak: "дней подряд", xp: "XP за неделю", level: "Уровень", done: "дней пройдено",
    toastOk: "Сохранено", toastOkD: "Результат принят. Так держать.", toastXp: "+40 XP", toastXpD: "Задача выполнена — серия в безопасности.",
    toastErr: "Не получилось загрузить", toastErrD: "Проверь интернет и попробуй ещё раз.",
    openDialog: "Открыть окно", openSheet: "Открыть шторку", dTitle: "Завершить день 12?", dDesc: "Сделано 3 задачи из 4. Последняя — по желанию.",
    dBody: "Завершённый день сохраняет серию и открывает день 13. Добавить результат можно и позже.",
    cancel: "Пока нет", finish: "Завершить день", sTitle: "Фильтры",
    tabs: { lesson: "Урок", tasks: "Задачи", notes: "Заметки" }, tabLesson: "Сегодня один промпт превратится в работающую страницу.",
    tabTasks: "Четыре короткие задачи, около 70 минут.", tabNotes: "Твои личные заметки к этому дню.",
    emptyT: "Пока ничего не сохранено", emptyD: "Нажми на закладку у любого видео или статьи в библиотеке — и они появятся здесь.",
    browse: "Открыть библиотеку", tip: "Заморозка серии спасает один пропущенный день.",
    md: `## Твой первый деплой\n\nСегодня страница, которую ты собрал вчера, окажется **в интернете**. Это займёт минут *десять*.\n\n1. Открой проект и попроси агента: \`задеплой это на Cloudflare Pages\`\n2. Пройди шаги, которые он покажет\n3. Вставь ссылку в задачу ниже\n\n> [!TIP] Если что-то упало — скопируй ошибку целиком в чат. Агент читает ошибки лучше большинства людей.\n\n\`\`\`bash\nnpx wrangler pages deploy ./dist\n\`\`\`\n\nПодробнее — в [документации Cloudflare](https://developers.cloudflare.com/pages/).`,
  },
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line py-10 first:border-t-0 first:pt-0">
      <h2 className="mb-6 text-xs font-semibold uppercase tracking-[0.08em] text-muted">{title}</h2>
      {children}
    </section>
  );
}

const TOKENS = ["bg", "surface", "surface-2", "surface-3", "fg", "muted", "line", "line-strong", "accent", "accent-soft", "accent-ink",
  "gold", "gold-bright", "gold-soft", "danger", "danger-soft", "info", "info-soft"];

export default function Showcase() {
  const t = useStrings(S);
  const ui = useStrings(uiStrings);
  const { toast } = useToast();
  const [dlg, setDlg] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [track, setTrack] = useState("apps");
  const [chips, setChips] = useState<string[]>(["ai"]);
  const [sw, setSw] = useState(true);
  const [url, setUrl] = useState("my-app");
  const [share, setShare] = useState(false);
  const lang = t.eyebrow === "Design system" ? "en" : "ru";
  const shareData = { kind: "day" as const, lang: lang as "en" | "ru", day: 12, title: t.shareTitle, streak: 11, xp: 1240, name: lang === "ru" ? "Аня" : "Alex", track: "apps" as const };

  return (
    <div>
      <PageHeader eyebrow={t.eyebrow} title={t.title} description={t.desc}
        actions={<><LangSwitcher /><ThemeToggle /></>} />

      <Section title={t.buttons}>
        <div className="flex flex-wrap items-center gap-3">
          <Button iconRight={<ArrowRight />}>{t.startDay}</Button>
          <Button variant="secondary">{t.continue}</Button>
          <Button variant="outline">{t.preview}</Button>
          <Button variant="ghost">{t.skip}</Button>
          <Button variant="soft" icon={<Plus />}>{t.continue}</Button>
          <Button variant="gold" icon={<Sparkles />}>{t.claim}</Button>
          <Button variant="danger">{t.del}</Button>
          <Button variant="link">{t.preview}</Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button size="sm">{t.continue}</Button>
          <Button size="md">{t.continue}</Button>
          <Button size="lg">{t.continue}</Button>
          <Button loading>{t.continue}</Button>
          <Button disabled>{t.continue}</Button>
          <Tooltip content={t.tip}><Button size="icon" variant="outline" aria-label={t.tip}><Flame /></Button></Tooltip>
          <Button size="icon-sm" variant="ghost" aria-label={t.continue}><Star /></Button>
        </div>
      </Section>

      <Section title={t.forms}>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="grid gap-5">
            <Field label={t.link} hint={t.linkHint} error={url && !/^https?:\/\//.test(url) ? t.linkErr : undefined}>
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" inputMode="url" />
            </Field>
            <Field label={t.note} optional={ui.optional}>
              <Textarea placeholder={t.notePh} />
            </Field>
            <Field label={t.track}>
              <Select defaultValue="apps"><option value="apps">{t.apps}</option><option value="video">{t.video}</option></Select>
            </Field>
          </div>
          <Card className="grid content-start gap-4">
            <Checkbox label={t.task1} description={t.task1d} defaultChecked />
            <Checkbox label={t.task2} />
            <Divider />
            <Switch checked={sw} onChange={setSw} label={t.reminders} />
            <Segmented label={t.track} value={track} onChange={setTrack}
              options={[{ value: "apps", label: t.apps, icon: <Code2 aria-hidden /> }, { value: "video", label: t.video, icon: <Video aria-hidden /> }]} />
            <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
              {["ai", "claude", "deploy", "motion", "api"].map((c, i) => (
                <Chip key={c} count={[12, 8, 5, 9, 14][i]} selected={chips.includes(c)}
                  onClick={() => setChips((xs) => xs.includes(c) ? xs.filter((x) => x !== c) : [...xs, c])}>#{c}</Chip>
              ))}
            </div>
          </Card>
        </div>
      </Section>

      <Section title={t.feedback}>
        <div className="flex flex-wrap gap-2">
          <Badge>Day 12</Badge><Badge tone="accent">{t.apps}</Badge><Badge tone="gold" icon={<Zap />}>+40 XP</Badge>
          <Badge tone="danger">Needs work</Badge><Badge tone="info">Beta</Badge><Badge tone="outline">EN</Badge><Badge size="sm" tone="accent">New</Badge>
        </div>
        <AiNotice className="mt-5 max-w-xl" />
        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => toast({ title: t.toastOk, description: t.toastOkD, tone: "success" })}>Toast · success</Button>
          <Button variant="outline" onClick={() => toast({ title: t.toastXp, description: t.toastXpD, tone: "reward" })}>Toast · reward</Button>
          <Button variant="outline" onClick={() => toast({ title: t.toastErr, description: t.toastErrD, tone: "error" })}>Toast · error</Button>
        </div>
      </Section>

      <Section title={t.data}>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="flex items-center gap-5">
            <ProgressRing value={12} max={66} size={84} stroke={7} label={t.done}>
              <span className="text-base">12<span className="text-muted">/66</span></span>
            </ProgressRing>
            <Stat value="12" label={t.done} hint="18%" />
          </Card>
          <Card className="grid gap-4">
            <Stat value="9" label={t.dayStreak} icon={<Flame />} tone="gold" />
            <ProgressBar value={340} max={500} label={t.level + " 4"} showValue="340 / 500" tone="gold" />
          </Card>
          <Card className="grid gap-4">
            <Stat value="1 240" label={t.xp} icon={<Zap />} tone="accent" />
            <ProgressBar value={62} label={t.continue} size="sm" />
          </Card>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <Avatar name="Аня Смирнова" /><Avatar name="Leo Park" ring="gold" /><Avatar name="Marta" size={44} ring="accent" />
          <Avatar name="Ibrahim Khan" size={28} /><Avatar name="Дима" size={52} />
        </div>
      </Section>

      <Section title={t.overlays}>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setDlg(true)}>{t.openDialog}</Button>
          <Button variant="outline" onClick={() => setSheet(true)}>{t.openSheet}</Button>
        </div>
        <Dialog open={dlg} onClose={() => setDlg(false)} title={t.dTitle} description={t.dDesc}
          footer={<><Button variant="ghost" onClick={() => setDlg(false)}>{t.cancel}</Button><Button onClick={() => setDlg(false)}>{t.finish}</Button></>}>
          <p className="text-[0.9375rem] text-muted">{t.dBody}</p>
        </Dialog>
        <Sheet open={sheet} onClose={() => setSheet(false)} title={t.sTitle}>
          <div className="flex flex-wrap gap-2">{["ai", "claude", "deploy", "motion"].map((c) => <Chip key={c}>#{c}</Chip>)}</div>
        </Sheet>
      </Section>

      <Section title={t.nav}>
        <Tabs label={t.nav} items={[
          { value: "lesson", label: t.tabs.lesson, icon: <BookOpen /> },
          { value: "tasks", label: t.tabs.tasks, count: 4 },
          { value: "notes", label: t.tabs.notes },
        ]}>
          {(v) => <p className="text-muted">{v === "lesson" ? t.tabLesson : v === "tasks" ? t.tabTasks : t.tabNotes}</p>}
        </Tabs>
        <div className="mt-6"><Tabs label={t.track} variant="pill" items={[{ value: "week", label: "7d" }, { value: "all", label: "All time" }]} /></div>
        <div className="mt-6 flex items-center gap-6"><Logo /><LeafMark size={40} /><LeafMark size={20} /><Kbd>⌘</Kbd><Kbd>K</Kbd></div>
      </Section>

      <Section title={t.share}>
        <div className="grid items-start gap-4 sm:grid-cols-[340px_1fr]">
          <ShareCard data={shareData} />
          <div className="grid gap-4">
            <ShareCard data={{ ...shareData, kind: "streak" }} format="landscape" theme="dark" />
            <div><Button icon={<Sparkles />} onClick={() => setShare(true)}>{t.openShare}</Button></div>
          </div>
        </div>
        <ShareDialog open={share} onClose={() => setShare(false)} data={shareData} />
      </Section>

      <Section title={t.content}>
        <Markdown source={t.md} />
      </Section>

      <Section title={t.empty}>
        <div className="grid gap-4 md:grid-cols-2">
          <EmptyState icon={<BookOpen />} title={t.emptyT} description={t.emptyD} action={<Button variant="outline">{t.browse}</Button>} />
          <div className="grid gap-3" role="status" aria-label="Loading">
            <SkeletonCard />
            <div className="flex items-center gap-3"><Skeleton circle className="size-10" /><SkeletonText lines={2} className="flex-1" /></div>
          </div>
        </div>
      </Section>

      <Section title={t.colors}>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {TOKENS.map((k) => (
            <div key={k} className="overflow-hidden rounded-[10px] border border-line">
              <div className="h-12" style={{ background: `var(--${k})` }} />
              <div className="bg-surface px-2 py-1.5 font-mono text-[0.6875rem] text-muted">{k}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title={t.type}>
        <div className="grid gap-3">
          <p className="text-5xl font-semibold tracking-tight">66 <em className="font-serif-em">дней</em> / days</p>
          <p className="text-[2.125rem] font-semibold leading-tight tracking-tight">Display · Заголовок страницы</p>
          <p className="text-2xl font-semibold tracking-tight">Title · Раздел</p>
          <p className="text-lg font-semibold">Heading · Карточка</p>
          <p>Body · Съешь же ещё этих мягких французских булок. The quick brown fox.</p>
          <p className="text-sm text-muted">Small · подписи, метаданные, hints</p>
          <p className="font-mono text-sm">mono · npx wrangler deploy</p>
        </div>
      </Section>
    </div>
  );
}
