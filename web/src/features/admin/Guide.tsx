// OWNER: library agent. Short in-admin guide for the founder, written natively in EN and RU.
import { ClipboardPaste, Workflow, ScanEye, Rocket, AlertTriangle, Lightbulb } from "lucide-react";
import type { ReactNode } from "react";
import { useLang, useStrings } from "@web/i18n";
import { ButtonLink, Card, CardHeader } from "@web/ui";

interface Section { icon: ReactNode; title: string; body: string[] }
const G: Record<"en" | "ru", { lead: string; steps: Section[]; stuck: { title: string; items: [string, string][] }; review: Section; tips: Section; cta: string }> = {
  en: {
    lead: "Four moves, every day: paste, let the pipeline work, review, publish. Ten links take about ten minutes of your time.",
    steps: [
      { icon: <ClipboardPaste />, title: "1. Paste", body: [
        "Open “Add resources” and paste anything with links in it: a list, a forwarded chat message, your notes. YouTube videos and Shorts, Instagram reels and posts, and any article or docs page are all recognised.",
        "Check the preview. Links already in the library are marked, so you won't add a duplicate. Click ✕ to skip a link.",
        "Batch settings apply to every link: tracks, level, who gets the lesson (RU, EN or both), curriculum days, and a note for Claude (“focus on the first 10 minutes”). Leave tracks empty and Claude will suggest them.",
      ] },
      { icon: <Workflow />, title: "2. Let it run", body: [
        "Each link moves through five steps: fetch → transcript → RU lesson → EN lesson → publish. The panel on the right updates on its own, so you can keep pasting.",
        "Fetching takes the title, author, cover and length. For YouTube we try the captions; for articles, the page text. The two lessons are written separately: the Russian one for a Russian-speaking beginner, the English one for an English-speaking beginner. Different examples, same core.",
      ] },
      { icon: <ScanEye />, title: "3. Review", body: [
        "Open “Needs review” on the Pipeline tab. The review screen shows the card, the transcript and the log on top, and the RU and EN lessons side by side below. Fix anything, then press “Save & approve” for each language.",
        "Use “Next to review” to go through the queue one by one.",
      ] },
      { icon: <Rocket />, title: "4. Publish", body: [
        "“Publish” puts it in the student library. A language without an approved lesson still works: students get the original as a plain link.",
        "To publish many at once, tick them on the Pipeline tab and press “Publish”.",
      ] },
    ],
    stuck: { title: "When something needs you", items: [
      ["Needs a transcript", "Captions or page text weren't reachable (always the case for Instagram). Open the resource and paste the transcript or upload .srt / .vtt / .txt. The lessons rebuild on their own. Once the media worker is connected, this happens automatically."],
      ["Only a starter draft", "AI isn't configured (no ANTHROPIC_API_KEY). The draft is pre-filled from the metadata. Finish it by hand, or add the key and press “Rebuild both lessons”."],
      ["Lesson generation failed", "Rare: the model's answer didn't pass validation twice. Press “Rebuild” for that language. If it keeps failing, add a note for Claude and try again."],
      ["Couldn't fetch", "The link is private, removed or blocks robots. Check it opens in your browser, then “Re-fetch metadata”, or fill in the title by hand."],
    ] },
    review: { icon: <ScanEye />, title: "What to check in a lesson (2 minutes)", body: [
      "Facts: nothing in the summary that isn't in the video or article.",
      "Exercise: can a beginner do it today, in under an hour, and show a result (link, screenshot, short text)?",
      "Quiz: exactly one right answer per question, and the explanation makes sense.",
      "Russian: “ты”, natural tone. Says honestly when the original is in English and how to watch it (subtitles, auto-translate).",
      "Days: the suggested day fits what students actually do that day.",
    ] },
    tips: { icon: <Lightbulb />, title: "Small things that help", body: [
      "Your note for Claude is the strongest lever: “for absolute beginners”, “only the Remotion part”, “skip the sponsor”.",
      "A Russian-only or English-only original? Set “Write lessons for” to one language.",
      "Put the best pieces on a shelf (review screen → Shelves) and tick “Featured”, so they come first.",
      "Curriculum days are what make a resource appear on a student's day page. Assign them in the batch settings or on the review screen.",
    ] },
    cta: "Add resources",
  },
  ru: {
    lead: "Каждый день четыре действия: вставил, конвейер поработал, проверил, опубликовал. Десять ссылок — примерно десять минут твоего времени.",
    steps: [
      { icon: <ClipboardPaste />, title: "1. Вставь", body: [
        "Открой «Добавить» и вставь всё, где есть ссылки: список, пересланное сообщение, свои заметки. Мы распознаём видео и Shorts с YouTube, рилсы и посты из Instagram, любые статьи и документацию.",
        "Проверь превью. Ссылки, которые уже есть в библиотеке, помечены — дубля не будет. Лишнее убери крестиком.",
        "Настройки партии применяются ко всем ссылкам: треки, уровень, для кого писать уроки (RU, EN или оба), дни программы и заметка для Claude («сфокусируйся на первых 10 минутах»). Треки можно не выбирать — Claude предложит сам.",
      ] },
      { icon: <Workflow />, title: "2. Дай конвейеру поработать", body: [
        "Каждая ссылка проходит пять шагов: загрузка → расшифровка → урок RU → урок EN → публикация. Панель справа обновляется сама, можно спокойно вставлять дальше.",
        "При загрузке берём название, автора, обложку и длительность. Для YouTube пробуем субтитры, для статей — текст страницы. Уроки пишутся отдельно: русский — для русскоязычного новичка, английский — для англоязычного. Примеры разные, суть одна.",
      ] },
      { icon: <ScanEye />, title: "3. Проверь", body: [
        "Во вкладке «Конвейер» открой «На проверке». На экране проверки сверху карточка, расшифровка и журнал, ниже — уроки RU и EN рядом. Поправь, что нужно, и нажми «Сохранить и одобрить» для каждого языка.",
        "Кнопка «Следующий на проверку» ведёт по очереди дальше.",
      ] },
      { icon: <Rocket />, title: "4. Опубликуй", body: [
        "«Опубликовать» — и материал в библиотеке у учеников. Если урока на каком-то языке нет, ничего страшного: ученик увидит оригинал как обычную ссылку.",
        "Чтобы опубликовать сразу несколько, отметь их галочками в «Конвейере» и нажми «Опубликовать».",
      ] },
    ],
    stuck: { title: "Когда нужен ты", items: [
      ["Нужна расшифровка", "Субтитры или текст страницы получить не удалось (у Instagram — всегда). Открой материал и вставь расшифровку или загрузи .srt / .vtt / .txt — уроки пересоберутся сами. Когда подключим медиа-воркер, это будет происходить автоматически."],
      ["Только стартовый черновик", "AI не настроен (нет ANTHROPIC_API_KEY). Черновик заполнен по метаданным — допиши руками или добавь ключ и нажми «Пересобрать оба урока»."],
      ["Урок не собрался", "Редко: ответ модели дважды не прошёл проверку. Нажми «Пересобрать» для этого языка. Не помогает — добавь заметку для Claude и попробуй ещё раз."],
      ["Не получилось загрузить", "Ссылка закрыта, удалена или не пускает роботов. Проверь, что она открывается у тебя в браузере, и нажми «Обновить метаданные» — или впиши название руками."],
    ] },
    review: { icon: <ScanEye />, title: "Что проверить в уроке (2 минуты)", body: [
      "Факты: в «Кратко» нет ничего, чего нет в видео или статье.",
      "Задание: новичок сделает его сегодня, меньше чем за час, и сможет показать результат (ссылка, скриншот, пара строк).",
      "Тест: в каждом вопросе ровно один верный ответ, пояснение по делу.",
      "Русский: на «ты», живым языком; честно сказано, если оригинал на английском, и как его смотреть (субтитры, автоперевод).",
      "Дни: предложенный день подходит к тому, что ученики в этот день реально делают.",
    ] },
    tips: { icon: <Lightbulb />, title: "Мелочи, которые помогают", body: [
      "Заметка для Claude — самый сильный рычаг: «для совсем новичков», «только часть про Remotion», «рекламу пропусти».",
      "Оригинал только для русской или только для английской аудитории? Оставь в «Для кого писать уроки» один язык.",
      "Лучшее поставь на полку (экран проверки → «Полки в библиотеке») и отметь «В подборку» — будет показываться первым.",
      "Дни программы — это то, благодаря чему материал появится у ученика на странице дня. Назначай их в настройках партии или на экране проверки.",
    ] },
    cta: "Добавить материалы",
  },
};

export default function Guide() {
  const g = useStrings(G);
  const lang = useLang();
  return (
    <div className="max-w-[70ch] space-y-6">
      <p className="text-lg text-muted">{g.lead}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {g.steps.map((st) => (
          <Card key={st.title} as="section">
            <CardHeader icon={st.icon} title={st.title} />
            <div className="space-y-2.5 text-[0.9375rem] leading-relaxed">{st.body.map((p, i) => <p key={i}>{p}</p>)}</div>
          </Card>
        ))}
      </div>
      <Card as="section" tone="gold">
        <CardHeader icon={<AlertTriangle />} title={g.stuck.title} />
        <dl className="space-y-3">
          {g.stuck.items.map(([t, d]) => (
            <div key={t}><dt className="font-medium">{t}</dt><dd className="mt-0.5 text-[0.9375rem] leading-relaxed text-fg/85">{d}</dd></div>
          ))}
        </dl>
      </Card>
      {[g.review, g.tips].map((sec) => (
        <Card key={sec.title} as="section">
          <CardHeader icon={sec.icon} title={sec.title} />
          <ul className="list-disc space-y-1.5 pl-5 text-[0.9375rem] leading-relaxed marker:text-muted">{sec.body.map((p, i) => <li key={i}>{p}</li>)}</ul>
        </Card>
      ))}
      <ButtonLink to={`/${lang}/admin/add`} variant="primary">{g.cta}</ButtonLink>
    </div>
  );
}
