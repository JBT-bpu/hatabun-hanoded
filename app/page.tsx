"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import EmberField from "./EmberField";
import HeatHaze from "./HeatHaze";
import LottieFlame from "./LottieFlame";
import StoryCanvas from "./StoryCanvas";

const whatsappBase = "https://wa.me/972544669111?text=";

const stages = [
  {
    number: "01",
    tab: "מגיעים",
    label: "הבמה נפתחת",
    title: "נכנסים עם נוכחות.",
    text: "הטאבון לא מתחבא מאחורי הקלעים. הוא מגיע אל מרכז האירוע, מוכן להפוך לעמדה שכולם רואים.",
    word: "הטאבון",
  },
  {
    number: "02",
    tab: "מדליקים",
    label: "הרגע משתנה",
    title: "אש אמיתית. בזמן אמת.",
    text: "הלהבה עולה, האבן מתחממת והריח מתחיל לעבוד. זה הרגע שבו האורחים מתקרבים מעצמם.",
    word: "האש",
  },
  {
    number: "03",
    tab: "מגישים",
    label: "הביס הראשון",
    title: "מהטאבון ישר ליד.",
    text: "פוקאצ׳ות יוצאות חמות מול העיניים, עם הרטבים והתוספות שבחרתם לאירוע.",
    word: "עכשיו",
  },
];

const menus = {
  dairy: {
    label: "חלבי",
    title: "קרמי, רענן, לוהט.",
    image: "/campaign/menu-dairy.webp",
    alt: "פוקאצ׳ה חלבית מוארכת עם גבינות, עגבניות וזיתים ליד טאבון בוער",
    options: ["מוצרלה", "בולגרית", "צפתית", "פסטו", "אנטיפסטי", "זיתים"],
  },
  meat: {
    label: "בשרי",
    title: "עמוק, עסיסי, מהאש.",
    image: "/campaign/menu-meat.webp",
    alt: "פוקאצ׳ה בשרית מוארכת עם בשר, בצל, עשבי תיבול ופלפל ליד טאבון בוער",
    options: ["שווארמה", "בשר טחון", "חצילים", "בצל סגול", "חריף", "טפנד"],
  },
};

const faqs = [
  ["חלבי או בשרי?", "שני הכיוונים אפשריים. בשיחה הראשונה בוחרים את האופי והתוספות שמתאימים לאירוע."],
  ["איפה מקימים?", "בבית, בטבע, באולם או בגן אירועים. ספרו לנו על הלוקיישן ונבדוק את ההתאמה."],
  ["עמדה מרכזית או תוספת?", "אפשר לבנות את הטאבון כמרכז קבלת הפנים או לשלב אותו לצד עמדות נוספות."],
  ["איך מקבלים הצעה?", "שולחים תאריך, מיקום וכמה מילים על האירוע בוואטסאפ — ואנחנו ממשיכים משם."],
];

const eventCategories = [
  {
    number: "01",
    title: "בבית",
    titleLines: ["בבית"],
    kicker: "קרוב / אישי",
    image: "/campaign/event-home.webp",
    alt: "אהרון, הגמל והטאבון הנודד באירוע ביתי אינטימי",
  },
  {
    number: "02",
    title: "בטבע",
    titleLines: ["בטבע"],
    kicker: "פתוח / פראי",
    image: "/campaign/event-nature.webp",
    alt: "אהרון, הגמל והטאבון הנודד באירוע בטבע בשעת שקיעה",
  },
  {
    number: "03",
    title: "באולם או בגן",
    titleLines: ["באולם", "או בגן"],
    kicker: "מדויק / מרשים",
    image: "/campaign/event-venue.webp",
    alt: "אהרון, הגמל והטאבון הנודד באולם וגן אירועים בערב",
  },
];

const storyLayerStyle = (index: number) => ({
  "--stage-alpha": `var(--stage-${index}-alpha)`,
  "--stage-y": `var(--stage-${index}-y)`,
  "--stage-blur": `var(--stage-${index}-blur)`,
} as CSSProperties);

function BrandEmblem({ variant = "primary" }: { variant?: "primary" | "seal" }) {
  const source = variant === "primary"
    ? "/brand/brand-primary-logo.png"
    : "/brand/brand-round-seal.png";

  return (
    <span className={`emblem emblem-${variant}`} aria-hidden="true">
      <img
        className="emblem-crest"
        src={source}
        alt=""
        decoding="async"
      />
    </span>
  );
}

export default function Home() {
  const [lit, setLit] = useState(false);
  const [activeStage, setActiveStage] = useState(0);
  const [menuMode, setMenuMode] = useState<keyof typeof menus>("dairy");
  const [selected, setSelected] = useState<string[]>(["מוצרלה", "פסטו", "אנטיפסטי"]);
  const [activeGallery, setActiveGallery] = useState<number | null>(null);
  const heroRef = useRef<HTMLElement>(null);
  const stageShellRef = useRef<HTMLDivElement>(null);
  const ignitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menu = menus[menuMode];
  const gallery = activeGallery === null ? null : eventCategories[activeGallery];

  useEffect(() => {
    const root = document.documentElement;
    const revealElements = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let storyTarget = 0;
    let storyCurrent = 0;
    let storyFrame = 0;
    let storyInitialized = false;

    const revealInView = () => {
      revealElements.forEach((element) => {
        if (element.classList.contains("is-visible")) return;
        const rect = element.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) element.classList.add("is-visible");
      });
    };

    const clamp = (value: number) => Math.min(1, Math.max(0, value));
    const smootherstep = (start: number, end: number, value: number) => {
      const amount = clamp((value - start) / (end - start));
      return amount * amount * amount * (amount * (amount * 6 - 15) + 10);
    };

    const paintStory = (progress: number) => {
      const shell = stageShellRef.current;
      if (!shell) return;
      const phaseOne = smootherstep(0.18, 0.36, progress);
      const phaseTwo = smootherstep(0.64, 0.82, progress);
      const weights = [1 - phaseOne, phaseOne * (1 - phaseTwo), phaseTwo];
      const coordinate = phaseOne + phaseTwo;
      const heat = Math.max(
        4 * phaseOne * (1 - phaseOne),
        4 * phaseTwo * (1 - phaseTwo),
      );
      const centers = [0.09, 0.5, 0.91];

      shell.style.setProperty("--story-progress", String(progress));
      shell.style.setProperty("--story-coordinate", String(coordinate));
      shell.style.setProperty("--story-heat", String(heat));
      shell.style.setProperty("--story-heat-opacity", String(0.06 + heat * 0.36));
      shell.style.setProperty("--story-line", `${Math.max(0.01, progress) * 100}%`);
      shell.style.setProperty("--story-heat-x", `${(1 - progress) * 100}%`);
      shell.style.setProperty("--story-scan-y", `${-28 + progress * 150}%`);

      weights.forEach((weight, index) => {
        const distance = progress - centers[index];
        shell.style.setProperty(`--stage-${index}-alpha`, String(weight));
        shell.style.setProperty(`--stage-${index}-y`, `${distance * 42}px`);
        shell.style.setProperty(`--stage-${index}-blur`, `${(1 - weight) * 4}px`);
      });

      const nextStage = weights.indexOf(Math.max(...weights));
      setActiveStage((current) => current === nextStage ? current : nextStage);
    };

    const renderStory = () => {
      storyFrame = 0;
      const distance = storyTarget - storyCurrent;
      storyCurrent = reducedMotion || Math.abs(distance) < 0.0005
        ? storyTarget
        : storyCurrent + distance * 0.14;
      paintStory(storyCurrent);
      if (Math.abs(storyTarget - storyCurrent) >= 0.0005) {
        storyFrame = requestAnimationFrame(renderStory);
      }
    };

    const updateStory = () => {
      const shell = stageShellRef.current;
      if (!shell) return;
      const rect = shell.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight);
      storyTarget = clamp(-rect.top / travel);
      if (!storyInitialized) {
        storyCurrent = storyTarget;
        storyInitialized = true;
        paintStory(storyCurrent);
        return;
      }
      if (!storyFrame) storyFrame = requestAnimationFrame(renderStory);
    };

    const updateScroll = () => {
      const max = document.body.scrollHeight - window.innerHeight;
      root.style.setProperty("--scroll", max > 0 ? String(window.scrollY / max) : "0");
      revealInView();
      updateStory();
    };
    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });
    window.addEventListener("resize", updateScroll, { passive: true });

    const observer = typeof IntersectionObserver === "function"
      ? new IntersectionObserver(
          (entries) => entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer?.unobserve(entry.target);
            }
          }),
          { threshold: 0.08 },
        )
      : null;
    revealElements.forEach((element) => observer?.observe(element));

    return () => {
      window.removeEventListener("scroll", updateScroll);
      window.removeEventListener("resize", updateScroll);
      if (storyFrame) cancelAnimationFrame(storyFrame);
      observer?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (activeGallery === null) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveGallery(null);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [activeGallery]);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    ignitionTimerRef.current = setTimeout(() => setLit(true), reducedMotion ? 0 : 620);
    return () => {
      if (ignitionTimerRef.current) clearTimeout(ignitionTimerRef.current);
    };
  }, []);

  const menuHref = useMemo(() => {
    const choice = selected.length ? selected.join(", ") : "לבחירה משותפת";
    return `${whatsappBase}${encodeURIComponent(`היי הטאבון הנודד, אשמח להצעה לאירוע. הכיוון שמעניין אותי: ${menu.label}. תוספות: ${choice}`)}`;
  }, [menu.label, selected]);

  const mainWhatsapp = `${whatsappBase}${encodeURIComponent("היי הטאבון הנודד, אשמח לקבל הצעה לאירוע")}`;

  function moveHeat(event: React.PointerEvent<HTMLElement>) {
    const element = heroRef.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    element.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    element.style.setProperty("--my", `${event.clientY - rect.top}px`);
    element.style.setProperty("--px", String(x - 0.5));
    element.style.setProperty("--py", String(y - 0.5));
  }

  function chooseMode(mode: keyof typeof menus) {
    setMenuMode(mode);
    setSelected(menus[mode].options.slice(0, 3));
  }

  function toggleIngredient(item: string) {
    setSelected((current) =>
      current.includes(item) ? current.filter((value) => value !== item) : [...current, item],
    );
  }

  function toggleFire() {
    if (ignitionTimerRef.current) {
      clearTimeout(ignitionTimerRef.current);
      ignitionTimerRef.current = null;
    }
    setLit((value) => !value);
  }

  function goToStage(index: number) {
    const shell = stageShellRef.current;
    if (!shell) {
      setActiveStage(index);
      return;
    }
    const top = window.scrollY + shell.getBoundingClientRect().top;
    const travel = Math.max(0, shell.offsetHeight - window.innerHeight);
    const centers = [0.09, 0.5, 0.91];
    const target = top + centers[index] * travel;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: target, behavior: reducedMotion ? "auto" : "smooth" });
  }

  function handleStageKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | null = null;
    if (event.key === "ArrowLeft") nextIndex = Math.min(stages.length - 1, index + 1);
    if (event.key === "ArrowRight") nextIndex = Math.max(0, index - 1);
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = stages.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    document.getElementById(`story-tab-${nextIndex}`)?.focus();
    goToStage(nextIndex);
  }

  return (
    <main className={lit ? "site-is-lit" : "site-is-dim"}>
      <EmberField lit={lit} />
      <a className="skip-link" href="#experience">דילוג לתוכן</a>
      <div className="scroll-progress" aria-hidden="true" />

      <section
        ref={heroRef}
        className="poster-hero"
        id="top"
        onPointerMove={moveHeat}
        aria-labelledby="hero-title"
        data-ember-zone
      >
        <header className="poster-nav">
          <a className="nav-brand" href="#top" aria-label="הטאבון הנודד — חזרה לראש העמוד">
            <img src="/brand/brand-horizontal-logo-v2.webp" alt="" />
          </a>
          <nav aria-label="ניווט ראשי">
            <a href="#experience">החוויה</a>
            <a href="#menu">התפריט</a>
            <a href="#events">אירועים</a>
          </nav>
          <a href="tel:+972544669111"><bdi>054-4669-111</bdi> / אהרון</a>
        </header>

        <div
          className="poster-photo"
          aria-label="טאבון נייד בוער באירוע ערב"
          data-ember-source="hero"
          data-ember-x="0.88"
          data-ember-y="0.55"
        >
          <picture>
            <source media="(max-width: 760px)" srcSet="/campaign/hero-mobile.webp" />
            <img src="/campaign/hero-desktop.webp" alt="אהרון מגיש פוקאצ׳ה ליד הטאבון הנייד באירוע ערב" />
          </picture>
          <HeatHaze src="/campaign/hero-desktop.webp" lit={lit} />
          <div className="photo-vignette" aria-hidden="true" />
          <div className="heat-cursor" aria-hidden="true" />
          <p className="photo-stamp"><span>LIVE FIRE</span> / <b>01</b></p>
        </div>

        <div className="poster-copy">
          <div className="poster-copy-inner">
            <div className="hero-brand-lockup">
              <BrandEmblem />
              <p className="poster-edition">מהדורת אירועים / 2026</p>
              <h1 id="hero-title" className="sr-only">הטאבון הנודד — טאבון נייד לאירועים</h1>
            </div>
            <div className="brand-strike" aria-hidden="true" />
            <p className="poster-slogan">
              <span>האש נדלקת.</span>
              <strong>האירוע מתחיל.</strong>
            </p>
            <p className="poster-body">
              טאבון שמגיע אליכם, נדלק מול האורחים ומוציא פוקאצ׳ות חמות בדיוק כשהערב מתחיל לזוז.
            </p>
            <div className="poster-actions">
              <a className="poster-cta" href={mainWhatsapp} target="_blank" rel="noreferrer" data-ember-burst="28" data-ember-target=".poster-photo">
                <span>הצעה לאירוע</span><i aria-hidden="true">↙</i>
              </a>
              <a className="poster-text-link" href="#experience">כנסו לחוויה <span aria-hidden="true">↓</span></a>
            </div>
          </div>
        </div>

        <button
          className="ignition"
          type="button"
          aria-pressed={lit}
          aria-label={lit ? "כיבוי האש באתר" : "הדלקת האש באתר"}
          onClick={toggleFire}
          data-ember-burst="42"
          data-ember-toggle="true"
        >
          <LottieFlame active={lit} />
          <b>{lit ? "בוער" : "הדליקו"}</b>
          <small>{lit ? "לחצו לכיבוי" : "לחצו לאש"}</small>
        </button>

        <div className="poster-ticker" aria-label="יתרונות">
          <div>
            <span>נאפה במקום</span><i>◆</i><span>חלבי או בשרי</span><i>◆</i>
            <span>מול האורחים</span><i>◆</i><span>לבית, לטבע ולאולם</span><i>◆</i>
            <span>נאפה במקום</span><i>◆</i><span>חלבי או בשרי</span><i>◆</i>
          </div>
        </div>
      </section>

      <section className="theater section-dark" id="experience" aria-labelledby="experience-title" data-ember-zone>
        <div className="section-index" data-reveal>
          <span>01</span><i /> <p>תיאטרון האש</p>
        </div>
        <header className="editorial-heading" data-reveal>
          <p>לא עוד “עמדת אוכל”</p>
          <h2 id="experience-title">שלושה רגעים.<br /><em>שואו אחד.</em></h2>
        </header>

        <div ref={stageShellRef} className="stage-shell story-scroll">
          <div className="stage-sticky">
            <div className="stage-tabs" role="tablist" aria-label="שלבי החוויה" data-reveal>
              {stages.map((stage, index) => (
                <button
                  key={stage.number}
                  id={`story-tab-${index}`}
                  type="button"
                  role="tab"
                  aria-selected={activeStage === index}
                  aria-controls={`story-panel-${index}`}
                  tabIndex={activeStage === index ? 0 : -1}
                  onClick={() => goToStage(index)}
                  onKeyDown={(event) => handleStageKeyDown(event, index)}
                  data-ember-burst="22"
                  data-ember-target=".story-arch"
                >
                  <span>{stage.number}</span>
                  <b>{stage.tab}</b>
                  <i aria-hidden="true" />
                </button>
              ))}
            </div>

            <div className="stage-display">
              <div className="stage-copy-stack">
                {stages.map((stage, index) => (
                  <article
                    key={stage.number}
                    id={`story-panel-${index}`}
                    className="stage-copy stage-copy-panel"
                    role="tabpanel"
                    aria-labelledby={`story-tab-${index}`}
                    aria-hidden={activeStage !== index}
                    data-active={activeStage === index ? "true" : "false"}
                    style={storyLayerStyle(index)}
                  >
                    <p>{stage.label}</p>
                    <h3>{stage.title}</h3>
                    <span>{stage.text}</span>
                    <div className="story-progress" aria-hidden="true">
                      <i />
                      <b>{stage.number} / 03</b>
                    </div>
                  </article>
                ))}
              </div>

              <div className="stage-visual" aria-hidden="true">
                {stages.map((stage, index) => (
                  <span
                    key={stage.number}
                    className="stage-word stage-word-layer"
                    style={storyLayerStyle(index)}
                  >
                    {stage.word}
                  </span>
                ))}
                <div
                  className="stage-arch story-arch"
                  data-ember-source="stage"
                  data-ember-x="0.5"
                  data-ember-y="0.48"
                >
                  <StoryCanvas />
                  <div className="stage-flare" />
                  <span className="story-scanline" />
                </div>
                <p className="story-live-stack">
                  {stages.map((stage, index) => (
                    <span key={stage.number} style={storyLayerStyle(index)}>LIVE / {stage.number}</span>
                  ))}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="brand-motif-rail" aria-label="סמלי המותג" data-reveal>
        {[
          ["/brand/icon-flame-v2.png", "אש חיה"],
          ["/brand/icon-wheat-v2.png", "בצק טרי"],
          ["/brand/icon-peel-v2.png", "נאפה מולכם"],
          ["/brand/icon-palm-v2.png", "מגיעים לכל מקום"],
          ["/brand/icon-oven-v2.png", "הטאבון הנודד"],
        ].map(([source, label], index) => (
          <div className="brand-motif" key={source}>
            <span>0{index + 1}</span>
            <img src={source} alt="" aria-hidden="true" />
            <p>{label}</p>
          </div>
        ))}
      </section>

      <section className="menu-lab" id="menu" aria-labelledby="menu-title">
        <div className="menu-photo" data-reveal data-ember-zone data-ember-source="menu" data-ember-x="0.27" data-ember-y="0.53">
          <div className="menu-image-stack">
            {(Object.keys(menus) as Array<keyof typeof menus>).map((mode) => (
              <img
                key={mode}
                src={menus[mode].image}
                alt={menuMode === mode ? menus[mode].alt : ""}
                aria-hidden={menuMode !== mode}
                data-active={menuMode === mode ? "true" : "false"}
              />
            ))}
          </div>
          <div className="menu-photo-shade" aria-hidden="true" />
          <p className="menu-photo-title">בונים את הביס.</p>
          <div className="chosen-orbit" aria-live="polite">
            {selected.slice(0, 5).map((item, index) => (
              <span key={item} style={{ "--pos": index } as CSSProperties}>{item}</span>
            ))}
          </div>
          <span className="menu-counter"><bdi>{String(selected.length).padStart(2, "0")}</bdi> / תוספות</span>
        </div>

        <div className="menu-console" data-reveal>
          <div className="section-index section-index-dark"><span>02</span><i /><p>המעבדה</p></div>
          <p className="console-kicker">בחרו כיוון. שחקו עם האש.</p>
          <h2 id="menu-title">מה יוצא<br />מהטאבון?</h2>
          <div className="mode-switch" role="tablist" aria-label="סוג התפריט">
            {(Object.keys(menus) as Array<keyof typeof menus>).map((mode) => (
              <button
                key={mode}
                type="button"
                role="tab"
                aria-selected={menuMode === mode}
                onClick={() => chooseMode(mode)}
                data-ember-burst="16"
                data-ember-target=".menu-photo"
              >
                {menus[mode].label}
              </button>
            ))}
          </div>
          <p className="menu-direction" key={menuMode}>{menu.title}</p>
          <div className="ingredient-grid" aria-label="בחירת תוספות">
            {menu.options.map((item) => (
              <button
                type="button"
                key={item}
                className={selected.includes(item) ? "is-selected" : ""}
                aria-pressed={selected.includes(item)}
                onClick={() => toggleIngredient(item)}
                data-ember-burst="7"
                data-ember-target=".menu-photo"
              >
                <span>{selected.includes(item) ? "−" : "+"}</span>{item}
              </button>
            ))}
          </div>
          <a className="menu-submit" href={menuHref} target="_blank" rel="noreferrer">
            שלחו את הכיוון לוואטסאפ <span aria-hidden="true">↙</span>
          </a>
          <small>הבחירה כאן היא השראה — את התפריט הסופי סוגרים יחד.</small>
        </div>
      </section>

      <section className="events section-dark" id="events" aria-labelledby="events-title" data-ember-zone>
        <div className="section-index" data-reveal><span>03</span><i /><p>הלוקיישן שלכם</p></div>
        <header className="events-heading" data-reveal>
          <div>
            <h2 id="events-title">אנחנו מביאים<br /><em>את הלהבה.</em></h2>
            <p>אתם רק בוחרים איפה היא נדלקת.</p>
          </div>
        </header>
        <div className="events-brand-stage" data-reveal aria-hidden="true">
          <span>LIVE FIRE / ON THE ROAD</span>
          <img className="events-brand-mark" src="/brand/brand-camel-oven-icon-v2.webp" alt="" />
          <i />
        </div>
        <div className="events-grid" data-reveal>
          {eventCategories.map((category, index) => (
            <button
              className="event-card"
              type="button"
              key={category.title}
              aria-haspopup="dialog"
              aria-label={`פתיחת גלריית אירועים ${category.title}`}
              onClick={() => setActiveGallery(index)}
              data-ember-burst="18"
              data-ember-target=".events-brand-stage"
            >
              <img src={category.image} alt="" aria-hidden="true" />
              <span>{category.number}</span>
              <div className="event-card-copy">
                <p>{category.kicker}</p>
                <h3>{category.titleLines.map((line) => <span key={line}>{line}</span>)}</h3>
              </div>
              <i aria-hidden="true">פתחו גלריה ↙</i>
            </button>
          ))}
        </div>
      </section>

      {gallery && (
        <div
          className="gallery-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="gallery-title"
        >
          <button className="gallery-backdrop" type="button" onClick={() => setActiveGallery(null)} aria-label="סגירת הגלריה" />
          <button className="gallery-close" type="button" onClick={() => setActiveGallery(null)} aria-label="סגירת הגלריה">×</button>
          <div className="gallery-viewer">
            <figure>
              <img src={gallery.image} alt={gallery.alt} />
              <figcaption><bdi>01 / 01</bdi> — שער הגלריה</figcaption>
            </figure>
            <div className="gallery-copy">
              <p>{gallery.number} / גלריית אירועים</p>
              <h2 id="gallery-title">{gallery.title}</h2>
              <span>השער מוכן. את הרגעים האמיתיים מהאירועים נוסיף לכאן כשיעלו התמונות.</span>
              <button type="button" onClick={() => setActiveGallery(null)}>חזרה לאתר ↑</button>
            </div>
          </div>
        </div>
      )}

      <section className="answers" id="faq" aria-labelledby="faq-title">
        <div className="answers-intro" data-reveal>
          <div className="section-index section-index-dark"><span>04</span><i /><p>לפני שמדליקים</p></div>
          <h2 id="faq-title">קצר.<br />לעניין.<br /><em>חם.</em></h2>
          <a href="tel:+972544669111">יש עוד שאלה? <b>דברו איתנו</b></a>
        </div>
        <div className="answer-list" data-reveal>
          {faqs.map(([question, answer], index) => (
            <details key={question}>
              <summary><span>0{index + 1}</span><b>{question}</b><i>+</i></summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="final-poster" aria-labelledby="final-title" data-ember-zone data-ember-source="final" data-ember-arrival data-ember-x="0.49" data-ember-y="0.48">
        <img className="final-scene-image" src="/campaign/final-poster-wide.webp" alt="אהרון מוביל גמל ואת הטאבון הנודד אל אירוע ערב" />
        <div className="final-flame-line" aria-hidden="true"><i /><i /><i /><i /></div>
        <div className="final-orange" data-reveal>
          <span className="final-kicker">הטאבון הנודד / LIVE FIRE</span>
          <h2 id="final-title">יש אירוע באופק?<br />בואו ניתן לו <em>אש.</em></h2>
          <span className="final-orange-copy">אנחנו מגיעים, מדליקים ואופים מול האורחים. אתם נשארים עם ערב שאי אפשר לפספס.</span>
          <a href={mainWhatsapp} target="_blank" rel="noreferrer" data-ember-burst="32" data-ember-target=".final-poster">
            <span>מדליקים את התאריך</span><i>↙</i>
          </a>
          <div className="final-contacts">
            <a href="tel:+972544669111">אהרון / <bdi>054-4669-111</bdi></a>
            <a href="tel:+972544669112">מור / <bdi>054-4669-112</bdi></a>
            <a href="mailto:hatabunhanoded@gmail.com">hatabunhanoded@gmail.com</a>
          </div>
        </div>
      </section>

      <footer className="poster-footer" data-ember-zone>
        <span>תל אביב / ישראל</span>
        <span>© {new Date().getFullYear()} הטאבון הנודד</span>
        <a href="#top">חזרה לאש ↑</a>
      </footer>

      <div className="mobile-bar">
        <a href={mainWhatsapp} target="_blank" rel="noreferrer">WhatsApp</a>
        <a href="tel:+972544669111">חייגו</a>
      </div>
    </main>
  );
}
