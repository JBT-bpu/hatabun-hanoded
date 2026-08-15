"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import EmberField from "./EmberField";
import HeatHaze from "./HeatHaze";

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
    options: ["מוצרלה", "בולגרית", "צפתית", "פסטו", "אנטיפסטי", "זיתים"],
  },
  meat: {
    label: "בשרי",
    title: "עמוק, עסיסי, מהאש.",
    options: ["שווארמה", "בשר טחון", "חצילים", "בצל סגול", "חריף", "טפנד"],
  },
};

const faqs = [
  ["חלבי או בשרי?", "שני הכיוונים אפשריים. בשיחה הראשונה בוחרים את האופי והתוספות שמתאימים לאירוע."],
  ["איפה מקימים?", "בבית, בטבע, באולם או בגן אירועים. ספרו לנו על הלוקיישן ונבדוק את ההתאמה."],
  ["עמדה מרכזית או תוספת?", "אפשר לבנות את הטאבון כמרכז קבלת הפנים או לשלב אותו לצד עמדות נוספות."],
  ["איך מקבלים הצעה?", "שולחים תאריך, מיקום וכמה מילים על האירוע בוואטסאפ — ואנחנו ממשיכים משם."],
];

function BrandEmblem({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`emblem ${compact ? "emblem-compact" : ""}`} aria-hidden="true">
      <span className="emblem-orbit"><i /><i /><i /></span>
      <span className="emblem-arch">
        <span className="css-flame"><i /></span>
      </span>
      <span className="emblem-line" />
    </span>
  );
}

export default function Home() {
  const [lit, setLit] = useState(false);
  const [activeStage, setActiveStage] = useState(0);
  const [menuMode, setMenuMode] = useState<keyof typeof menus>("dairy");
  const [selected, setSelected] = useState<string[]>(["מוצרלה", "פסטו", "אנטיפסטי"]);
  const heroRef = useRef<HTMLElement>(null);
  const stageShellRef = useRef<HTMLDivElement>(null);
  const ignitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menu = menus[menuMode];

  useEffect(() => {
    const root = document.documentElement;
    const revealElements = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));

    const revealInView = () => {
      revealElements.forEach((element) => {
        if (element.classList.contains("is-visible")) return;
        const rect = element.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) element.classList.add("is-visible");
      });
    };

    const updateStory = () => {
      const shell = stageShellRef.current;
      if (!shell) return;
      const rect = shell.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight);
      const progress = Math.min(1, Math.max(0, -rect.top / travel));
      const nextStage = Math.min(stages.length - 1, Math.floor(progress * stages.length));
      shell.style.setProperty("--story-progress", String(progress));
      setActiveStage((current) => current === nextStage ? current : nextStage);
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
      observer?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setLit(true);
      return;
    }

    ignitionTimerRef.current = setTimeout(() => setLit(true), 620);
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
    const target = top + (index / Math.max(1, stages.length - 1)) * travel;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: target, behavior: reducedMotion ? "auto" : "smooth" });
    setActiveStage(index);
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
          <p><span>TLV</span> / טאבון נייד לאירועים</p>
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
          data-ember-x="0.36"
          data-ember-y="0.57"
        >
          <img src="/hero-fire.png" alt="טאבון נייד בוער ופוקאצ׳ה יוצאת אל אורחי האירוע" />
          <HeatHaze src="/hero-fire.png" lit={lit} />
          <div className="photo-vignette" aria-hidden="true" />
          <div className="heat-cursor" aria-hidden="true" />
          <p className="photo-stamp"><span>LIVE FIRE</span> / <b>01</b></p>
        </div>

        <div className="poster-copy">
          <div className="poster-copy-inner">
            <BrandEmblem />
            <p className="poster-edition">מהדורת אירועים / 2026</p>
            <h1 id="hero-title">הטאבון הנודד</h1>
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
          <span className="ignition-core"><i /></span>
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

        <div ref={stageShellRef} className="stage-shell story-scroll" data-reveal>
          <div className="stage-sticky">
            <div className="stage-tabs" role="tablist" aria-label="שלבי החוויה">
              {stages.map((stage, index) => (
                <button
                  key={stage.number}
                  type="button"
                  role="tab"
                  aria-selected={activeStage === index}
                  onClick={() => goToStage(index)}
                  data-ember-burst="22"
                  data-ember-target=".stage-arch"
                >
                  <span>{stage.number}</span>
                  <b>{stage.tab}</b>
                  <i aria-hidden="true" />
                </button>
              ))}
            </div>

            <div className="stage-display" role="tabpanel" key={stages[activeStage].number}>
              <div className="stage-copy">
                <p>{stages[activeStage].label}</p>
                <h3>{stages[activeStage].title}</h3>
                <span>{stages[activeStage].text}</span>
                <div className="story-progress" aria-hidden="true">
                  <i style={{ "--story-step": (activeStage + 1) / stages.length } as CSSProperties} />
                  <b>{stages[activeStage].number} / 03</b>
                </div>
              </div>
              <div className="stage-visual" aria-hidden="true">
                <span className="stage-word">{stages[activeStage].word}</span>
                <div
                  className="stage-arch story-arch"
                  data-ember-source="stage"
                  data-ember-x="0.5"
                  data-ember-y="0.48"
                  style={{ "--story-position": `${activeStage * 50}%` } as CSSProperties}
                >
                  <div className="story-filmstrip" />
                  <div className="stage-flare" />
                  <span className="story-scanline" />
                </div>
                <p>LIVE / {stages[activeStage].number}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="menu-lab" id="menu" aria-labelledby="menu-title">
        <div className="menu-photo" data-reveal data-ember-zone data-ember-source="menu" data-ember-x="0.27" data-ember-y="0.53">
          <img src="/hero-fire.png" alt="פוקאצ׳ה חמה ליד טאבון בוער" />
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
          <h2 id="events-title">אנחנו מביאים<br /><em>את הלהבה.</em></h2>
          <p>אתם רק בוחרים איפה היא נדלקת.</p>
        </header>
        <div className="events-grid" data-reveal>
          <article className="event-card">
            <span>01</span><p>קרוב / אישי</p><h3>בבית</h3><i>↙</i>
          </article>
          <article className="event-card event-card-orange">
            <span>02</span><p>פתוח / פראי</p><h3>בטבע</h3><i>↙</i>
          </article>
          <article className="event-card event-card-cream">
            <span>03</span><p>מדויק / מרשים</p><h3>באולם<br />או בגן</h3><i>↙</i>
          </article>
        </div>
      </section>

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

      <section className="final-poster" aria-labelledby="final-title">
        <div className="final-black" data-ember-zone data-ember-source="final" data-ember-arrival data-ember-x="0.5" data-ember-y="0.34">
          <BrandEmblem />
          <p>הטאבון הנודד</p>
          <h2 id="final-title">האש<br />מחכה.</h2>
        </div>
        <div className="final-orange">
          <p>יש תאריך? יש לוקיישן?<br />מכאן זה כבר מתחמם.</p>
          <a href={mainWhatsapp} target="_blank" rel="noreferrer" data-ember-burst="32" data-ember-target=".final-black">
            <span>בואו נדליק אירוע</span><i>↙</i>
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
