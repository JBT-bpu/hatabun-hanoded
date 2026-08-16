"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import EmberField from "./EmberField";
import HeatHaze from "./HeatHaze";
import LottieFlame from "./LottieFlame";

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
  "--stage-blur": "0px",
  "--filmstrip-index": index,
} as CSSProperties);

const enterDelay = (delay: number) => ({ "--enter-delay": `${delay}ms` } as CSSProperties);

type GalleryPhase = "enter" | "open" | "exit";
type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void | Promise<void>) => unknown;
};

function prefersReducedMotion() {
  return typeof window !== "undefined"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function withViewTransition(update: () => void) {
  const transitionDocument = document as ViewTransitionDocument;
  if (!prefersReducedMotion() && transitionDocument.startViewTransition) {
    transitionDocument.startViewTransition(update);
    return;
  }
  update();
}

function burst(selector: string, count: number, intensity = 1) {
  window.dispatchEvent(new CustomEvent("fire:burst", {
    detail: { selector, count, intensity },
  }));
}

function BrandEmblem({ variant = "primary" }: { variant?: "primary" | "seal" }) {
  const source = variant === "primary"
    ? "/brand/brand-primary-logo-v2.webp"
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
  const [motionReady, setMotionReady] = useState(false);
  const [igniting, setIgniting] = useState(false);
  const [ignitionRun, setIgnitionRun] = useState(0);
  const [activeStage, setActiveStage] = useState(0);
  const [stageTransitionKey, setStageTransitionKey] = useState(0);
  const [menuMode, setMenuMode] = useState<keyof typeof menus>("dairy");
  const [selected, setSelected] = useState<string[]>(["מוצרלה", "פסטו", "אנטיפסטי"]);
  const [activeLocation, setActiveLocation] = useState(0);
  const [activeGallery, setActiveGallery] = useState<number | null>(null);
  const [galleryPhase, setGalleryPhase] = useState<GalleryPhase>("enter");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const heroRef = useRef<HTMLElement>(null);
  const stageShellRef = useRef<HTMLDivElement>(null);
  const stageStepperRef = useRef<HTMLDivElement>(null);
  const eventsGridRef = useRef<HTMLDivElement>(null);
  const finalRef = useRef<HTMLElement>(null);
  const galleryDialogRef = useRef<HTMLDivElement>(null);
  const galleryCloseRef = useRef<HTMLButtonElement>(null);
  const galleryTriggerRef = useRef<HTMLButtonElement | null>(null);
  const activeStageRef = useRef(0);
  const galleryPhaseRef = useRef<GalleryPhase>("enter");
  const ignitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ignitionEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ignitionFrameRef = useRef(0);
  const stageTransitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalArrivalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const galleryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepperFrameRef = useRef(0);
  const locationsFrameRef = useRef(0);
  const menu = menus[menuMode];
  const gallery = activeGallery === null ? null : eventCategories[activeGallery];

  const closeGallery = useCallback(() => {
    if (activeGallery === null || galleryPhaseRef.current === "exit") return;
    galleryPhaseRef.current = "exit";
    setGalleryPhase("exit");
    if (galleryTimerRef.current) clearTimeout(galleryTimerRef.current);
    galleryTimerRef.current = setTimeout(() => {
      withViewTransition(() => setActiveGallery(null));
    }, prefersReducedMotion() ? 0 : 180);
  }, [activeGallery]);

  useEffect(() => {
    const root = document.documentElement;
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const enterElements = Array.from(document.querySelectorAll<HTMLElement>("[data-enter]"));
    let reducedMotion = motionPreference.matches;
    let scrollFrame = 0;
    let readyFrame = 0;
    let storyInitialized = false;

    const markEntered = (element: HTMLElement) => element.classList.add("is-entered");
    const enterObserver = typeof IntersectionObserver === "function" && !reducedMotion
      ? new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            markEntered(entry.target as HTMLElement);
            enterObserver?.unobserve(entry.target);
          });
        }, { threshold: 0.08, rootMargin: "0px 0px -8% 0px" })
      : null;

    enterElements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      if (reducedMotion || !enterObserver || (rect.top < window.innerHeight * 0.92 && rect.bottom > 0)) {
        markEntered(element);
      } else {
        enterObserver.observe(element);
      }
    });

    const clamp = (value: number) => Math.min(1, Math.max(0, value));

    const paintStory = (progress: number) => {
      const shell = stageShellRef.current;
      if (!shell) return;
      const coordinate = progress * (stages.length - 1);
      const lowerStage = Math.floor(coordinate);
      const upperStage = Math.min(stages.length - 1, lowerStage + 1);
      const localProgress = coordinate - lowerStage;
      const blend = lowerStage === upperStage ? 0 : clamp((localProgress - 0.42) / 0.16);
      const weights = stages.map(() => 0);
      weights[lowerStage] = 1 - blend;
      weights[upperStage] += blend;
      const heat = Math.min(1, Math.abs(coordinate - Math.round(coordinate)) * 2);

      shell.style.setProperty("--story-progress", String(progress));
      shell.style.setProperty("--story-coordinate", String(coordinate));
      shell.style.setProperty("--story-heat", String(heat));
      shell.style.setProperty("--story-heat-opacity", String(heat * 0.34));
      shell.style.setProperty("--story-line", `${Math.max(0.01, progress) * 100}%`);
      shell.style.setProperty("--story-heat-x", `${(1 - progress) * 100}%`);

      weights.forEach((weight, index) => {
        const distance = coordinate - index;
        shell.style.setProperty(`--stage-${index}-alpha`, String(weight));
        shell.style.setProperty(`--stage-${index}-y`, `${distance * 12}px`);
        shell.style.setProperty(`--stage-${index}-blur`, "0px");
      });

      const nextStage = weights.indexOf(Math.max(...weights));
      if (nextStage !== activeStageRef.current) {
        activateStage(nextStage, storyInitialized);
      }
      storyInitialized = true;
    };

    const updateScroll = () => {
      scrollFrame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      root.style.setProperty("--scroll", max > 0 ? String(window.scrollY / max) : "0");

      const hero = heroRef.current;
      if (hero) {
        const rect = hero.getBoundingClientRect();
        const progress = clamp(-rect.top / Math.max(1, rect.height));
        const parallax = reducedMotion ? 0 : 4 - progress * 8;
        hero.style.setProperty("--hero-parallax-y", `${parallax}px`);
      }

      const shell = stageShellRef.current;
      if (shell && !window.matchMedia("(max-width: 760px)").matches) {
        const rect = shell.getBoundingClientRect();
        const travel = Math.max(1, rect.height - window.innerHeight);
        paintStory(clamp(-rect.top / travel));
      }
    };

    const scheduleScrollUpdate = () => {
      if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll);
    };

    const handleMotionPreference = () => {
      reducedMotion = motionPreference.matches;
      if (reducedMotion) enterElements.forEach(markEntered);
      scheduleScrollUpdate();
    };

    readyFrame = requestAnimationFrame(() => {
      root.classList.add("motion-ready");
      setMotionReady(true);
    });
    scheduleScrollUpdate();
    window.addEventListener("scroll", scheduleScrollUpdate, { passive: true });
    window.addEventListener("resize", scheduleScrollUpdate, { passive: true });
    motionPreference.addEventListener("change", handleMotionPreference);

    let finalePlayed = false;
    const finaleObserver = typeof IntersectionObserver === "function" && finalRef.current
      ? new IntersectionObserver((entries) => {
          if (finalePlayed || !entries.some((entry) => entry.isIntersecting)) return;
          finalePlayed = true;
          const finale = finalRef.current;
          finale?.setAttribute("data-arrived", "true");
          finale?.classList.add("is-arrived", "is-arriving");
          finalArrivalTimerRef.current = setTimeout(() => finale?.classList.remove("is-arriving"), 760);
          burst(".final-poster", window.matchMedia("(pointer: coarse)").matches ? 30 : 48, 1.04);
          finaleObserver?.disconnect();
        }, { threshold: 0.34 })
      : null;
    if (finaleObserver && finalRef.current) {
      finaleObserver.observe(finalRef.current);
    } else {
      finalRef.current?.setAttribute("data-arrived", "true");
      finalRef.current?.classList.add("is-arrived");
    }

    return () => {
      window.removeEventListener("scroll", scheduleScrollUpdate);
      window.removeEventListener("resize", scheduleScrollUpdate);
      motionPreference.removeEventListener("change", handleMotionPreference);
      root.classList.remove("motion-ready");
      if (scrollFrame) cancelAnimationFrame(scrollFrame);
      if (readyFrame) cancelAnimationFrame(readyFrame);
      if (stepperFrameRef.current) cancelAnimationFrame(stepperFrameRef.current);
      if (locationsFrameRef.current) cancelAnimationFrame(locationsFrameRef.current);
      if (ignitionFrameRef.current) cancelAnimationFrame(ignitionFrameRef.current);
      if (stageTransitionTimerRef.current) clearTimeout(stageTransitionTimerRef.current);
      if (finalArrivalTimerRef.current) clearTimeout(finalArrivalTimerRef.current);
      enterObserver?.disconnect();
      finaleObserver?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (activeGallery === null) return;
    const previousOverflow = document.body.style.overflow;
    const focusableSelector = "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])";
    const handleDialogKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeGallery();
        return;
      }
      if (event.key !== "Tab") return;
      const dialog = galleryDialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector))
        .filter((element) => !element.hasAttribute("hidden"));
      if (!focusable.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleDialogKeyDown);
    const focusFrame = requestAnimationFrame(() => {
      if (galleryPhaseRef.current === "exit") return;
      galleryCloseRef.current?.focus();
      galleryPhaseRef.current = "open";
      setGalleryPhase("open");
    });

    return () => {
      cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleDialogKeyDown);
      galleryTriggerRef.current?.focus({ preventScroll: true });
    };
  }, [activeGallery, closeGallery]);

  useEffect(() => {
    ignitionTimerRef.current = setTimeout(() => runIgnition(), prefersReducedMotion() ? 0 : 620);
    return () => {
      if (ignitionTimerRef.current) clearTimeout(ignitionTimerRef.current);
      if (ignitionEndTimerRef.current) clearTimeout(ignitionEndTimerRef.current);
      if (galleryTimerRef.current) clearTimeout(galleryTimerRef.current);
    };
  }, []);

  const menuHref = useMemo(() => {
    const choice = selected.length ? selected.join(", ") : "לבחירה משותפת";
    return `${whatsappBase}${encodeURIComponent(`היי הטאבון הנודד, אשמח להצעה לאירוע. הכיוון שמעניין אותי: ${menu.label}. תוספות: ${choice}`)}`;
  }, [menu.label, selected]);

  const mainWhatsapp = `${whatsappBase}${encodeURIComponent("היי הטאבון הנודד, אשמח לקבל הצעה לאירוע")}`;

  function activateStage(index: number, animate = true, force = false) {
    const changed = activeStageRef.current !== index;
    if (!changed && !force) return;

    activeStageRef.current = index;
    setActiveStage(index);

    const shell = stageShellRef.current;
    if (shell && window.matchMedia("(max-width: 760px)").matches) {
      const progress = index / Math.max(1, stages.length - 1);
      shell.style.setProperty("--story-progress", String(progress));
      shell.style.setProperty("--story-coordinate", String(index));
      shell.style.setProperty("--story-line", `${Math.max(0.01, progress) * 100}%`);
      shell.style.setProperty("--story-heat-x", `${(1 - progress) * 100}%`);
      shell.style.setProperty("--story-heat", "0");
      shell.style.setProperty("--story-heat-opacity", "0");
      stages.forEach((_, stageIndex) => {
        shell.style.setProperty(`--stage-${stageIndex}-alpha`, stageIndex === index ? "1" : "0");
        shell.style.setProperty(`--stage-${stageIndex}-y`, `${(index - stageIndex) * 12}px`);
        shell.style.setProperty(`--stage-${stageIndex}-blur`, "0px");
      });
    }

    if (!animate || prefersReducedMotion()) return;
    shell?.classList.add("is-stage-transitioning");
    setStageTransitionKey((current) => current + 1);
    burst(".story-arch", window.matchMedia("(pointer: coarse)").matches ? 24 : 36, 0.96);

    if (stageTransitionTimerRef.current) clearTimeout(stageTransitionTimerRef.current);
    stageTransitionTimerRef.current = setTimeout(() => {
      stageShellRef.current?.classList.remove("is-stage-transitioning");
    }, 420);
  }

  function runIgnition() {
    if (ignitionTimerRef.current) {
      clearTimeout(ignitionTimerRef.current);
      ignitionTimerRef.current = null;
    }
    if (ignitionEndTimerRef.current) clearTimeout(ignitionEndTimerRef.current);
    if (ignitionFrameRef.current) cancelAnimationFrame(ignitionFrameRef.current);

    setLit(true);
    setIgnitionRun((current) => current + 1);
    if (prefersReducedMotion()) {
      setIgniting(false);
      return;
    }

    setIgniting(false);
    ignitionFrameRef.current = requestAnimationFrame(() => {
      ignitionFrameRef.current = 0;
      setIgniting(true);
      burst(".poster-photo", window.matchMedia("(pointer: coarse)").matches ? 42 : 68, 1.2);
      ignitionEndTimerRef.current = setTimeout(() => setIgniting(false), 700);
    });
  }

  function chooseMode(mode: keyof typeof menus) {
    if (mode !== menuMode && !prefersReducedMotion()) {
      burst(".menu-photo", window.matchMedia("(pointer: coarse)").matches ? 20 : 30, 0.9);
    }
    setMenuMode(mode);
    setSelected(menus[mode].options.slice(0, 3));
  }

  function toggleIngredient(item: string) {
    if (!prefersReducedMotion()) {
      burst(".menu-photo", window.matchMedia("(pointer: coarse)").matches ? 14 : 22, 0.78);
    }
    setSelected((current) =>
      current.includes(item) ? current.filter((value) => value !== item) : [...current, item],
    );
  }

  function goToStage(index: number) {
    activateStage(index, true, true);

    if (window.matchMedia("(max-width: 760px)").matches) {
      return;
    }

    const shell = stageShellRef.current;
    if (!shell) return;
    const top = window.scrollY + shell.getBoundingClientRect().top;
    const travel = Math.max(0, shell.offsetHeight - window.innerHeight);
    const target = top + (index / Math.max(1, stages.length - 1)) * travel;
    window.scrollTo({ top: target, behavior: "auto" });
  }

  function handleStageStepperScroll() {
    if (!window.matchMedia("(max-width: 760px)").matches || stepperFrameRef.current) return;
    stepperFrameRef.current = requestAnimationFrame(() => {
      stepperFrameRef.current = 0;
      const stepper = stageStepperRef.current;
      if (!stepper) return;
      const center = stepper.getBoundingClientRect().left + stepper.clientWidth / 2;
      const panels = Array.from(stepper.querySelectorAll<HTMLElement>(".stage-copy-panel"));
      const closest = panels.reduce((best, panel, index) => {
        const rect = panel.getBoundingClientRect();
        const distance = Math.abs(rect.left + rect.width / 2 - center);
        return distance < best.distance ? { index, distance } : best;
      }, { index: activeStageRef.current, distance: Number.POSITIVE_INFINITY });
      activateStage(closest.index, true);
    });
  }

  function handleLocationsScroll() {
    if (locationsFrameRef.current) return;
    locationsFrameRef.current = requestAnimationFrame(() => {
      locationsFrameRef.current = 0;
      const grid = eventsGridRef.current;
      if (!grid) return;
      const center = grid.getBoundingClientRect().left + grid.clientWidth / 2;
      const cards = Array.from(grid.querySelectorAll<HTMLElement>(".event-card"));
      const closest = cards.reduce((best, card, index) => {
        const rect = card.getBoundingClientRect();
        const distance = Math.abs(rect.left + rect.width / 2 - center);
        return distance < best.distance ? { index, distance } : best;
      }, { index: 0, distance: Number.POSITIVE_INFINITY });
      setActiveLocation((current) => current === closest.index ? current : closest.index);
    });
  }

  function goToLocation(index: number) {
    setActiveLocation(index);
    const card = eventsGridRef.current?.querySelectorAll<HTMLElement>(".event-card")[index];
    card?.scrollIntoView({ behavior: "auto", block: "nearest", inline: "center" });
  }

  function openGallery(index: number, trigger: HTMLButtonElement) {
    if (galleryTimerRef.current) clearTimeout(galleryTimerRef.current);
    galleryTriggerRef.current = trigger;
    galleryPhaseRef.current = "enter";
    setActiveLocation(index);
    withViewTransition(() => {
      setGalleryPhase("enter");
      setActiveGallery(index);
    });
  }

  function toggleFaq(index: number) {
    setOpenFaq((current) => current === index ? null : index);
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
    <main
      className={`${lit ? "site-is-lit" : "site-is-dim"}${motionReady ? " motion-ready" : ""}${igniting ? " site-is-igniting" : ""}`}
      data-ignition-run={ignitionRun}
    >
      <EmberField lit={lit} />
      <a className="skip-link" href="#experience">דילוג לתוכן</a>
      <div className="scroll-progress" aria-hidden="true" />

      <section
        ref={heroRef}
        className="poster-hero"
        id="top"
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
          data-ember-x="0.5"
          data-ember-y="0.55"
        >
          <picture>
            <source media="(max-width: 760px)" srcSet="/campaign/hero-taboon-centered-mobile.webp" />
            <img src="/campaign/hero-taboon-centered.webp" alt="הטאבון הנייד בוער וממורכז בחלל חשוך" />
          </picture>
          <HeatHaze src="/campaign/hero-taboon-centered.webp" lit={lit} />
          <div className="photo-vignette" aria-hidden="true" />
          <p className="photo-stamp"><span>LIVE FIRE</span> / <b>01</b></p>
        </div>

        <div className="poster-copy">
          <div className="poster-copy-inner">
            <p className="poster-mobile-kicker">טאבון נייד לאירועים <span aria-hidden="true">•</span> נאפה מול האורחים</p>
            <div className="hero-brand-lockup">
              <span className="hero-brand-orbit" aria-hidden="true"><i /></span>
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
              <a className="poster-cta" href={mainWhatsapp} target="_blank" rel="noreferrer" data-ember-burst="36" data-ember-target=".poster-photo">
                <span>הצעה לאירוע</span><i aria-hidden="true">↙</i>
              </a>
              <a className="poster-text-link" href="#experience">ראו איך זה עובד <span aria-hidden="true">↓</span></a>
            </div>
          </div>
        </div>

        <button
          className="ignition"
          type="button"
          aria-label={lit ? "הפעלת רצף ההדלקה מחדש" : "הדלקת האש באתר"}
          onClick={runIgnition}
        >
          <LottieFlame active={lit} replayKey={ignitionRun} />
          <b>{lit ? "שוב" : "הדליקו"}</b>
          <small>{lit ? "הדליקו מחדש" : "לחצו לאש"}</small>
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
        <div className="section-index" data-enter>
          <span>01</span><i /> <p>תיאטרון האש</p>
        </div>
        <header className="editorial-heading" data-enter style={enterDelay(50)}>
          <p>לא עוד “עמדת אוכל”</p>
          <h2 id="experience-title">שלושה רגעים.<br /><em>שואו אחד.</em></h2>
        </header>

        <div ref={stageShellRef} className="stage-shell story-scroll">
          <div className="stage-sticky">
            <div className="stage-tabs" role="tablist" aria-label="שלבי החוויה" data-enter style={enterDelay(100)}>
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
                >
                  <span>{stage.number}</span>
                  <b>{stage.tab}</b>
                  <i aria-hidden="true" />
                </button>
              ))}
            </div>

            <div className="stage-display">
              <div ref={stageStepperRef} className="stage-copy-stack" onScroll={handleStageStepperScroll}>
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
                  <div className="story-filmstrip" aria-hidden="true">
                    {stages.map((filmStage, index) => (
                      <span
                        key={filmStage.number}
                        className="story-filmstrip-layer"
                        data-stage-index={index}
                        style={storyLayerStyle(index)}
                      />
                    ))}
                  </div>
                  <div className="stage-flare" />
                  <span key={stageTransitionKey} className="story-heat-wipe" />
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

      <section className="menu-lab" id="menu" aria-labelledby="menu-title">
        <div className="menu-photo" data-enter data-ember-zone data-ember-source="menu" data-ember-x="0.72" data-ember-y="0.38">
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
          <p className="menu-mode-stamp"><span>LIVE FIRE</span> / {menu.label}</p>
          <div className="menu-motif-dock" aria-label="מה נכנס לחוויה">
            {[
              ["/brand/icon-wheat-v2.png", "בצק טרי"],
              ["/brand/icon-peel-v2.png", "בוחרים"],
              ["/brand/icon-flame-v2.png", "אש חיה"],
              ["/brand/icon-oven-v2.png", "מגישים"],
            ].map(([source, label], index) => (
              <span className="menu-motif" key={source} data-active={index === Math.min(3, Math.max(0, selected.length - 1)) ? "true" : "false"}>
                <img src={source} alt="" aria-hidden="true" />
                <b>{label}</b>
              </span>
            ))}
          </div>
          <div className="chosen-orbit" aria-live="polite">
            {selected.slice(0, 4).map((item, index) => (
              <span key={item} style={{ "--pos": index } as CSSProperties}>{item}</span>
            ))}
          </div>
          <span className="menu-counter"><bdi>{String(selected.length).padStart(2, "0")}</bdi> / תוספות</span>
        </div>

        <div className="menu-console" data-enter style={enterDelay(60)}>
          <div className="section-index section-index-dark"><span>02</span><i /><p>תפריט חי</p></div>
          <p className="console-kicker">מה יוצא מהטאבון?</p>
          <h2 id="menu-title">בונים<br /><em>את הביס.</em></h2>
          <div className="mode-switch" role="tablist" aria-label="סוג התפריט">
            {(Object.keys(menus) as Array<keyof typeof menus>).map((mode) => (
              <button
                key={mode}
                type="button"
                role="tab"
                aria-selected={menuMode === mode}
                onClick={() => chooseMode(mode)}
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
              >
                <span>{selected.includes(item) ? "−" : "+"}</span>{item}
              </button>
            ))}
          </div>
          <a
            className="menu-submit"
            href={menuHref}
            target="_blank"
            rel="noreferrer"
            data-ember-burst="26"
          >
            שלחו את הכיוון לוואטסאפ <span aria-hidden="true">↙</span>
          </a>
          <small>הבחירה כאן היא השראה — את התפריט הסופי סוגרים יחד.</small>
        </div>
      </section>

      <section className="events section-dark" id="events" aria-labelledby="events-title" data-ember-zone>
        <div className="section-index" data-enter><span>03</span><i /><p>הלוקיישן שלכם</p></div>
        <header className="events-heading" data-enter style={enterDelay(50)}>
          <div>
            <h2 id="events-title">אנחנו מביאים<br /><em>את הלהבה.</em></h2>
            <p>אתם רק בוחרים איפה היא נדלקת.</p>
          </div>
        </header>
        <div className="events-brand-stage" data-enter style={enterDelay(90)} aria-hidden="true">
          <span>LIVE FIRE / ON THE ROAD</span>
          <img className="events-brand-mark" src="/brand/brand-camel-oven-icon-v2.webp" alt="" />
          <i />
        </div>
        <div ref={eventsGridRef} className="events-grid" data-enter style={enterDelay(120)} onScroll={handleLocationsScroll}>
          {eventCategories.map((category, index) => (
            <button
              className="event-card"
              type="button"
              key={category.title}
              aria-haspopup="dialog"
              aria-label={`פתיחת גלריית אירועים ${category.title}`}
              onFocus={() => setActiveLocation(index)}
              onClick={(event) => openGallery(index, event.currentTarget)}
              data-ember-burst="24"
            >
              <img
                src={category.image}
                alt=""
                aria-hidden="true"
                style={{ viewTransitionName: activeGallery === index ? "none" : `event-gallery-${index}` }}
              />
              <span>{category.number}</span>
              <div className="event-card-copy">
                <p>{category.kicker}</p>
                <h3>{category.titleLines.map((line) => <span key={line}>{line}</span>)}</h3>
              </div>
              <i aria-hidden="true">פתחו גלריה ↙</i>
            </button>
          ))}
        </div>
        <div className="events-indicator" role="group" aria-label="מעבר בין לוקיישנים">
          <output className="events-indicator-count" aria-live="polite"><bdi>{eventCategories[activeLocation].number} / 03</bdi></output>
          <span aria-hidden="true" />
          {eventCategories.map((category, index) => (
            <button
              key={category.number}
              type="button"
              aria-label={`מעבר ללוקיישן ${category.title}`}
              aria-current={activeLocation === index ? "true" : undefined}
              onClick={() => goToLocation(index)}
            >
              <i aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>

      {gallery && (
        <div
          ref={galleryDialogRef}
          className="gallery-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="gallery-title"
          tabIndex={-1}
          data-phase={galleryPhase}
        >
          <button className="gallery-backdrop" type="button" tabIndex={-1} onClick={closeGallery} aria-label="סגירת הגלריה" />
          <button ref={galleryCloseRef} className="gallery-close" type="button" onClick={closeGallery} aria-label="סגירת הגלריה">×</button>
          <div className="gallery-viewer" data-gallery-index={activeGallery}>
            <figure>
              <img
                src={gallery.image}
                alt={gallery.alt}
                style={{ viewTransitionName: `event-gallery-${activeGallery}` }}
              />
              <figcaption><bdi>01 / 01</bdi> — שער הגלריה</figcaption>
            </figure>
            <div className="gallery-copy">
              <p>{gallery.number} / גלריית אירועים</p>
              <h2 id="gallery-title">{gallery.title}</h2>
              <span>השער מוכן. את הרגעים האמיתיים מהאירועים נוסיף לכאן כשיעלו התמונות.</span>
              <button type="button" onClick={closeGallery}>חזרה לאתר ↑</button>
            </div>
          </div>
        </div>
      )}

      <section className="answers" id="faq" aria-labelledby="faq-title">
        <div className="answers-intro" data-enter>
          <div className="section-index section-index-dark"><span>04</span><i /><p>לפני שמדליקים</p></div>
          <h2 id="faq-title">קצר.<br />לעניין.<br /><em>חם.</em></h2>
          <a href="tel:+972544669111">יש עוד שאלה? <b>דברו איתנו</b></a>
        </div>
        <div className="answer-list" data-enter style={enterDelay(60)}>
          {faqs.map(([question, answer], index) => (
            <article className="answer-item" data-open={openFaq === index ? "true" : "false"} key={question}>
              <h3>
                <button
                  id={`faq-toggle-${index}`}
                  className="answer-toggle"
                  type="button"
                  aria-expanded={openFaq === index}
                  aria-controls={`faq-panel-${index}`}
                  onClick={() => toggleFaq(index)}
                >
                  <span>0{index + 1}</span><b>{question}</b><i aria-hidden="true">+</i>
                </button>
              </h3>
              <div
                id={`faq-panel-${index}`}
                className="answer-panel"
                role="region"
                aria-labelledby={`faq-toggle-${index}`}
                aria-hidden={openFaq !== index}
              >
                <div><p>{answer}</p></div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section ref={finalRef} className="final-poster" aria-labelledby="final-title" data-arrived="false" data-ember-zone data-ember-source="final" data-ember-x="0.49" data-ember-y="0.48">
        <img className="final-scene-image" src="/campaign/final-poster-wide.webp" alt="אהרון מוביל גמל ואת הטאבון הנודד אל אירוע ערב" />
        <div className="final-flame-line" aria-hidden="true"><i /><i /><i /><i /></div>
          <div className="final-orange">
          <span className="final-kicker">הטאבון הנודד / LIVE FIRE</span>
          <h2 id="final-title">יש אירוע באופק?<br />בואו ניתן לו <em>אש.</em></h2>
          <span className="final-orange-copy">אנחנו מגיעים, מדליקים ואופים מול האורחים. אתם נשארים עם ערב שאי אפשר לפספס.</span>
          <a href={mainWhatsapp} target="_blank" rel="noreferrer" data-ember-burst="42" data-ember-target=".final-poster">
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
        <a href={mainWhatsapp} target="_blank" rel="noreferrer" data-ember-burst="22">WhatsApp</a>
        <a href="tel:+972544669111" data-ember-burst="18">חייגו</a>
      </div>
    </main>
  );
}
