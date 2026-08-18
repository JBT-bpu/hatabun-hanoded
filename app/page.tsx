"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import EmberField from "./EmberField";
import HeatHaze from "./HeatHaze";
import LottieFlame from "./LottieFlame";
import SmoothScroll, { lenisStore, scrollWindowTo } from "./SmoothScroll";
import CinematicScroll from "./CinematicScroll";
import ShaderFlame from "./ShaderFlame";

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

type FocacciaTopping = {
  id: string;
  label: string;
  kind: string;
  side: "left" | "right";
  photo: string;
  stamp: string;
  imprint: { x: number; y: number; rotation: number };
  placements: [
    { x: number; y: number; scale: number; rotation: number },
    { x: number; y: number; scale: number; rotation: number },
  ];
};

const focacciaToppings: FocacciaTopping[] = [
  { id: "mozzarella", label: "מוצרלה", kind: "cheese", side: "left", photo: "/forge-blueprint/toppings/mozzarella.png", stamp: "/forge-blueprint/stamps/mozzarella.png", imprint: { x: 38, y: 38, rotation: -8 }, placements: [{ x: 41, y: 39, scale: .46, rotation: -10 }, { x: 60, y: 55, scale: .38, rotation: 11 }] },
  { id: "feta", label: "בולגרית", kind: "feta", side: "right", photo: "/forge-blueprint/toppings/feta.png", stamp: "/forge-blueprint/stamps/feta.png", imprint: { x: 62, y: 33, rotation: 7 }, placements: [{ x: 60, y: 34, scale: .37, rotation: 8 }, { x: 45, y: 58, scale: .31, rotation: -12 }] },
  { id: "pesto", label: "פסטו", kind: "pesto", side: "left", photo: "/forge-blueprint/toppings/pesto.png", stamp: "/forge-blueprint/stamps/pesto.png", imprint: { x: 40, y: 56, rotation: -13 }, placements: [{ x: 45, y: 47, scale: .34, rotation: -14 }, { x: 63, y: 62, scale: .28, rotation: 12 }] },
  { id: "antipasti", label: "אנטיפסטי", kind: "pepper", side: "right", photo: "/forge-blueprint/toppings/antipasti.png", stamp: "/forge-blueprint/stamps/antipasti.png", imprint: { x: 66, y: 49, rotation: 12 }, placements: [{ x: 66, y: 46, scale: .34, rotation: 12 }, { x: 48, y: 66, scale: .28, rotation: -15 }] },
  { id: "olives", label: "זיתים", kind: "olive", side: "left", photo: "/forge-blueprint/toppings/olives.png", stamp: "/forge-blueprint/stamps/olives.png", imprint: { x: 35, y: 64, rotation: 6 }, placements: [{ x: 38, y: 61, scale: .31, rotation: 7 }, { x: 69, y: 38, scale: .25, rotation: -9 }] },
  { id: "eggplant", label: "חצילים", kind: "eggplant", side: "right", photo: "/forge-blueprint/toppings/eggplant.png", stamp: "/forge-blueprint/stamps/eggplant.png", imprint: { x: 55, y: 62, rotation: -5 }, placements: [{ x: 55, y: 62, scale: .31, rotation: -5 }, { x: 32, y: 49, scale: .25, rotation: 10 }] },
  { id: "red-onion", label: "בצל סגול", kind: "onion", side: "left", photo: "/forge-blueprint/toppings/red-onion.png", stamp: "/forge-blueprint/stamps/red-onion.png", imprint: { x: 70, y: 36, rotation: 14 }, placements: [{ x: 68, y: 36, scale: .3, rotation: 14 }, { x: 52, y: 32, scale: .24, rotation: -8 }] },
  { id: "chilli", label: "חריף", kind: "chilli", side: "right", photo: "/forge-blueprint/toppings/chilli.png", stamp: "/forge-blueprint/stamps/chilli.png", imprint: { x: 45, y: 70, rotation: -9 }, placements: [{ x: 47, y: 68, scale: .29, rotation: -9 }, { x: 70, y: 54, scale: .22, rotation: 16 }] },
  { id: "tapenade", label: "טפנד", kind: "tapenade", side: "left", photo: "/forge-blueprint/toppings/tapenade.png", stamp: "/forge-blueprint/stamps/tapenade.png", imprint: { x: 56, y: 27, rotation: 5 }, placements: [{ x: 55, y: 29, scale: .29, rotation: 5 }, { x: 34, y: 55, scale: .23, rotation: -13 }] },
  { id: "herbs", label: "עשבי תיבול", kind: "herbs", side: "right", photo: "/forge-blueprint/toppings/herbs.png", stamp: "/forge-blueprint/stamps/herbs.png", imprint: { x: 54, y: 49, rotation: -3 }, placements: [{ x: 57, y: 49, scale: .3, rotation: -3 }, { x: 43, y: 31, scale: .23, rotation: 12 }] },
];

type MenuPhase = "idle" | "demo" | "building" | "branding" | "ready";
const demoToppings = ["מוצרלה", "פסטו", "אנטיפסטי"];

const faqs = [
  ["מה אפשר לשים על הפוקאצ׳ה?", "בוחרים מתוך מגוון של כ־10 תוספות, ובשיחה הראשונה מתאימים את השילובים לאופי האירוע."],
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

function BrandEmblem() {
  return (
    <span className="emblem emblem-primary" aria-hidden="true">
      <img
        className="emblem-crest"
        src="/brand/brand-primary-logo-v2.webp"
        alt=""
        width="905"
        height="1314"
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
  const [selected, setSelected] = useState<string[]>([]);
  const [menuDemoRunning, setMenuDemoRunning] = useState(false);
  const [menuBaking, setMenuBaking] = useState(false);
  const [menuBaked, setMenuBaked] = useState(false);
  const [menuBakeRun, setMenuBakeRun] = useState(0);
  const [activeLocation, setActiveLocation] = useState(0);
  const [activeGallery, setActiveGallery] = useState<number | null>(null);
  const [galleryPhase, setGalleryPhase] = useState<GalleryPhase>("enter");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [ignitionHint, setIgnitionHint] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const menuPhotoRef = useRef<HTMLDivElement>(null);
  const forgePeelRef = useRef<HTMLDivElement>(null);
  const menuSectionRef = useRef<HTMLElement>(null);
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
  const menuBakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuDemoTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const menuDemoPlayedRef = useRef(false);
  const menuUserInteractedRef = useRef(false);
  const stepperFrameRef = useRef(0);
  const locationsFrameRef = useRef(0);
  const litRef = useRef(false);
  const prefetchedRef = useRef(false);
  const chargingRef = useRef(false);
  const chargeFrameRef = useRef(0);
  const fizzleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heatTweenRef = useRef<gsap.core.Tween | null>(null);
  const gallery = activeGallery === null ? null : eventCategories[activeGallery];
  const menuPhase: MenuPhase = menuBaking
    ? "branding"
    : menuBaked
      ? "ready"
      : menuDemoRunning
        ? "demo"
        : selected.length
          ? "building"
          : "idle";

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
          burst(".final-poster", window.matchMedia("(pointer: coarse)").matches ? 6 : 10, 0.58);
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
    lenisStore.instance?.stop();
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
      lenisStore.instance?.start();
      window.removeEventListener("keydown", handleDialogKeyDown);
      galleryTriggerRef.current?.focus({ preventScroll: true });
    };
  }, [activeGallery, closeGallery]);

  useEffect(() => {
    // The site loads cold. Engaged visitors ignite it themselves via the
    // press-and-hold ritual; passive ones get auto-ignition on first real
    // scroll or after a grace period, so nobody is left in the ashes.
    if (prefersReducedMotion()) {
      runIgnition();
      return () => {
        if (ignitionEndTimerRef.current) clearTimeout(ignitionEndTimerRef.current);
        if (galleryTimerRef.current) clearTimeout(galleryTimerRef.current);
      };
    }

    document.documentElement.style.setProperty("--site-heat", "0");
    const autoIgnite = () => {
      if (!litRef.current && !chargingRef.current) runIgnition();
    };
    ignitionTimerRef.current = setTimeout(autoIgnite, 6000);
    const onFirstScroll = () => {
      if (litRef.current) {
        window.removeEventListener("scroll", onFirstScroll);
        return;
      }
      if (window.scrollY > window.innerHeight * 0.3) {
        window.removeEventListener("scroll", onFirstScroll);
        autoIgnite();
      }
    };
    window.addEventListener("scroll", onFirstScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onFirstScroll);
      if (ignitionTimerRef.current) clearTimeout(ignitionTimerRef.current);
      if (ignitionEndTimerRef.current) clearTimeout(ignitionEndTimerRef.current);
      if (galleryTimerRef.current) clearTimeout(galleryTimerRef.current);
      if (menuBakeTimerRef.current) clearTimeout(menuBakeTimerRef.current);
      menuDemoTimersRef.current.forEach(clearTimeout);
      menuDemoTimersRef.current = [];
      if (fizzleTimerRef.current) clearTimeout(fizzleTimerRef.current);
      if (chargeFrameRef.current) cancelAnimationFrame(chargeFrameRef.current);
      heatTweenRef.current?.kill();
    };
  }, []);

  useEffect(() => {
    const section = menuSectionRef.current;
    if (!section || menuDemoPlayedRef.current) return;

    const playDemo = () => {
      if (menuDemoPlayedRef.current || menuUserInteractedRef.current) return;
      menuDemoPlayedRef.current = true;

      if (prefersReducedMotion()) {
        setSelected(demoToppings);
        setMenuDemoRunning(false);
        setMenuBaked(true);
        return;
      }

      setMenuDemoRunning(true);
      demoToppings.forEach((label, index) => {
        const timer = setTimeout(() => {
          if (menuUserInteractedRef.current) return;
          setSelected((current) => current.includes(label) ? current : [...current, label]);
        }, 180 + (index * 330));
        menuDemoTimersRef.current.push(timer);
      });
      menuDemoTimersRef.current.push(setTimeout(() => setMenuDemoRunning(false), 1240));
    };

    if (typeof IntersectionObserver !== "function") {
      playDemo();
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      playDemo();
      observer.disconnect();
    }, { threshold: .42 });
    observer.observe(section);

    return () => observer.disconnect();
  }, []);

  const menuHref = useMemo(() => {
    const choice = selected.length ? selected.join(", ") : "לבחירה משותפת";
    return `${whatsappBase}${encodeURIComponent(`היי הטאבון הנודד, אשמח להצעה לאירוע. לפוקאצ׳ה בחרתי: ${choice}. אשמח לשמוע גם על הסלטים והקינוחים.`)}`;
  }, [selected]);

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
    burst(".story-arch", window.matchMedia("(pointer: coarse)").matches ? 5 : 8, 0.58);

    if (stageTransitionTimerRef.current) clearTimeout(stageTransitionTimerRef.current);
    stageTransitionTimerRef.current = setTimeout(() => {
      stageShellRef.current?.classList.remove("is-stage-transitioning");
    }, 420);
  }

  function rampHeat() {
    const root = document.documentElement;
    heatTweenRef.current?.kill();
    if (prefersReducedMotion()) {
      root.style.setProperty("--site-heat", "1");
      return;
    }
    heatTweenRef.current = gsap.to(root, {
      "--site-heat": 1,
      duration: 2.4,
      ease: "power2.inOut",
    });
  }

  function prefetchBelowFoldImages() {
    if (prefetchedRef.current) return;
    prefetchedRef.current = true;
    const schedule: (cb: () => void) => void =
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback
        : (cb) => window.setTimeout(cb, 2000);
    schedule(() => {
      [
        "/fire-story-filmstrip.webp",
        "/forge/forge-peel-baked.png",
        "/forge-blueprint/focaccia-outline.png",
      ].forEach((href) => {
        const link = document.createElement("link");
        link.rel = "prefetch";
        link.as = "image";
        link.href = href;
        document.head.appendChild(link);
      });
    });
  }

  function runIgnition() {
    if (ignitionTimerRef.current) {
      clearTimeout(ignitionTimerRef.current);
      ignitionTimerRef.current = null;
    }
    if (ignitionEndTimerRef.current) clearTimeout(ignitionEndTimerRef.current);
    if (ignitionFrameRef.current) cancelAnimationFrame(ignitionFrameRef.current);

    litRef.current = true;
    setLit(true);
    setIgnitionHint(false);
    setIgnitionRun((current) => current + 1);
    rampHeat();
    prefetchBelowFoldImages();
    if (prefersReducedMotion()) {
      setIgniting(false);
      return;
    }

    setIgniting(false);
    ignitionFrameRef.current = requestAnimationFrame(() => {
      ignitionFrameRef.current = 0;
      setIgniting(true);
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      burst(".poster-photo", coarse ? 28 : 44, 1.24);
      ignitionEndTimerRef.current = setTimeout(() => setIgniting(false), 1220);
    });
  }

  const CHARGE_MS = 850;

  function cancelCharge(button: HTMLButtonElement, fizzle: boolean) {
    if (!chargingRef.current) return;
    chargingRef.current = false;
    if (chargeFrameRef.current) cancelAnimationFrame(chargeFrameRef.current);
    chargeFrameRef.current = 0;
    button.classList.remove("is-charging");
    button.style.setProperty("--charge", "0");
    if (fizzle && !litRef.current) {
      button.classList.add("is-fizzle");
      setIgnitionHint(true);
      if (fizzleTimerRef.current) clearTimeout(fizzleTimerRef.current);
      fizzleTimerRef.current = setTimeout(() => button.classList.remove("is-fizzle"), 460);
    }
  }

  function startCharge(event: React.PointerEvent<HTMLButtonElement>) {
    if (litRef.current || chargingRef.current) return;
    if (prefersReducedMotion()) {
      runIgnition();
      return;
    }

    const button = event.currentTarget;
    chargingRef.current = true;
    button.classList.add("is-charging");
    const startedAt = performance.now();

    const step = (now: number) => {
      chargeFrameRef.current = 0;
      if (!chargingRef.current) return;
      const charge = Math.min(1, (now - startedAt) / CHARGE_MS);
      button.style.setProperty("--charge", String(charge));
      if (charge >= 1) {
        chargingRef.current = false;
        button.classList.remove("is-charging");
        button.style.setProperty("--charge", "0");
        runIgnition();
        return;
      }
      chargeFrameRef.current = requestAnimationFrame(step);
    };
    chargeFrameRef.current = requestAnimationFrame(step);
  }

  function releaseCharge(event: React.PointerEvent<HTMLButtonElement>) {
    cancelCharge(event.currentTarget, true);
  }

  function handleIgnitionClick(event: React.MouseEvent<HTMLButtonElement>) {
    if (litRef.current) {
      runIgnition();
      return;
    }
    // Pointer users ignite via press-and-hold; detail 0 means keyboard or
    // assistive tech activation, which must not be gated behind the hold.
    if (event.detail === 0) runIgnition();
  }

  function launchTopping(source: HTMLButtonElement, topping: FocacciaTopping) {
    if (prefersReducedMotion()) return;

    const peel = forgePeelRef.current;
    if (!peel) return;
    const sourceRect = source.getBoundingClientRect();
    const targetRect = peel.getBoundingClientRect();
    if (targetRect.bottom < 0 || targetRect.top > window.innerHeight) return;

    const flightSize = window.matchMedia("(pointer: coarse)").matches ? 48 : 66;
    const sourceX = sourceRect.left + (sourceRect.width / 2);
    const sourceY = sourceRect.top + (sourceRect.height / 2);
    const targetX = targetRect.left + (targetRect.width * topping.imprint.x / 100);
    const targetY = targetRect.top + (targetRect.height * topping.imprint.y / 100);
    const deltaX = targetX - sourceX;
    const deltaY = targetY - sourceY;
    const arcY = Math.min(-64, (deltaY * .48) - 82);

    const flight = document.createElement("span");
    flight.className = "forge-topping-flight";
    flight.dataset.kind = topping.kind;
    flight.setAttribute("aria-hidden", "true");
    flight.style.left = `${sourceX - (flightSize / 2)}px`;
    flight.style.top = `${sourceY - (flightSize / 2)}px`;
    flight.style.setProperty("--flight-size", `${flightSize}px`);
    flight.style.backgroundImage = `url(${topping.stamp})`;
    document.body.appendChild(flight);

    const animation = flight.animate([
      { opacity: 0, transform: "translate3d(0, 0, 0) scale(.46) rotate(-12deg)" },
      { opacity: 1, transform: `translate3d(${deltaX * .46}px, ${arcY}px, 0) scale(1.12) rotate(8deg)`, offset: .48 },
      { opacity: .18, transform: `translate3d(${deltaX}px, ${deltaY}px, 0) scale(.5) rotate(-5deg)` },
    ], {
      duration: 640,
      easing: "cubic-bezier(.18,.74,.18,1)",
      fill: "forwards",
    });

    const removeFlight = () => flight.remove();
    animation.onfinish = removeFlight;
    animation.oncancel = removeFlight;
  }

  function cancelMenuDemo() {
    menuUserInteractedRef.current = true;
    menuDemoTimersRef.current.forEach(clearTimeout);
    menuDemoTimersRef.current = [];
    setMenuDemoRunning(false);
  }

  function toggleIngredient(topping: FocacciaTopping, source: HTMLButtonElement) {
    cancelMenuDemo();
    if (menuBakeTimerRef.current) clearTimeout(menuBakeTimerRef.current);
    setMenuBaking(false);
    setMenuBaked(false);
    const isAdding = !selected.includes(topping.label);
    if (!prefersReducedMotion()) {
      burst(".menu-photo", window.matchMedia("(pointer: coarse)").matches ? 2 : 4, 0.46);
    }
    if (isAdding) launchTopping(source, topping);
    setSelected((current) =>
      current.includes(topping.label)
        ? current.filter((value) => value !== topping.label)
        : [...current, topping.label],
    );
  }

  function clearIngredients() {
    cancelMenuDemo();
    if (menuBakeTimerRef.current) clearTimeout(menuBakeTimerRef.current);
    setMenuBaking(false);
    setMenuBaked(false);
    setSelected([]);
  }

  function runMenuBake() {
    if (!selected.length || menuBaking) return;
    cancelMenuDemo();
    if (menuBakeTimerRef.current) clearTimeout(menuBakeTimerRef.current);
    setMenuBakeRun((current) => current + 1);
    setMenuBaked(false);

    if (prefersReducedMotion()) {
      setMenuBaked(true);
      return;
    }

    setMenuBaking(true);
    burst(".forge-blueprint-stage", window.matchMedia("(pointer: coarse)").matches ? 28 : 46, 1.3);
    menuBakeTimerRef.current = setTimeout(() => {
      setMenuBaking(false);
      setMenuBaked(true);
    }, 1680);
  }

  function editMenuBuild() {
    cancelMenuDemo();
    if (menuBakeTimerRef.current) clearTimeout(menuBakeTimerRef.current);
    setMenuBaking(false);
    setMenuBaked(false);
  }

  function trackMenuForge(event: React.PointerEvent<HTMLDivElement>) {
    if (window.matchMedia("(pointer: coarse)").matches || prefersReducedMotion()) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    event.currentTarget.style.setProperty("--forge-x", `${x * 100}%`);
    event.currentTarget.style.setProperty("--forge-y", `${y * 100}%`);
    event.currentTarget.style.setProperty("--forge-tilt-x", `${(x - 0.5) * 5}deg`);
    event.currentTarget.style.setProperty("--forge-tilt-y", `${(0.5 - y) * 4}deg`);
  }

  function resetMenuForge() {
    menuPhotoRef.current?.style.setProperty("--forge-tilt-x", "0deg");
    menuPhotoRef.current?.style.setProperty("--forge-tilt-y", "0deg");
  }

  function goToStage(index: number) {
    activateStage(index, true, true);

    if (window.matchMedia("(max-width: 760px)").matches) {
      document.getElementById(`story-panel-${index}`)?.scrollIntoView({
        behavior: "auto",
        block: "nearest",
        inline: "center",
      });
      return;
    }

    const shell = stageShellRef.current;
    if (!shell) return;
    const top = window.scrollY + shell.getBoundingClientRect().top;
    const travel = Math.max(0, shell.offsetHeight - window.innerHeight);
    const target = top + (index / Math.max(1, stages.length - 1)) * travel;
    scrollWindowTo(target, true);
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
      <SmoothScroll />
      <CinematicScroll />
      <EmberField lit={lit} />
      <a className="skip-link" href="#experience">דילוג לתוכן</a>
      <div className="scroll-progress" aria-hidden="true"><i className="scroll-progress-ember" /></div>

      <section
        ref={heroRef}
        className="poster-hero"
        id="top"
        aria-labelledby="hero-title"
        data-ember-zone
      >
        <header className="poster-nav">
          <a className="nav-brand" href="#top" aria-label="הטאבון הנודד — חזרה לראש העמוד">
            <img src="/brand/brand-horizontal-logo-v2.webp" alt="" width="1400" height="514" decoding="async" />
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
            <img
              src="/campaign/hero-taboon-centered.webp"
              alt="הטאבון הנייד בוער וממורכז בחלל חשוך"
              width="960"
              height="540"
              decoding="async"
              fetchPriority="high"
            />
          </picture>
          <HeatHaze src="/campaign/hero-taboon-centered.webp" lit={lit} />
          <div className="shader-flame-dock" aria-hidden="true">
            <ShaderFlame lit={lit} />
          </div>
          <span key={ignitionRun} className="heat-wave" aria-hidden="true" />
          <div className="photo-vignette" aria-hidden="true" />
          <p className="photo-stamp"><span>LIVE FIRE</span> / <b>01</b></p>
        </div>

        <div key={`ignition-climax-${ignitionRun}`} className="ignition-climax" aria-hidden="true">
          {Array.from({ length: 18 }, (_, index) => (
            <i
              key={index}
              style={{
                "--x": `${((index * 37) % 92) - 46}vw`,
                "--y": `${-(24 + ((index * 17) % 34))}vh`,
                "--r": `${-48 + ((index * 29) % 96)}deg`,
                "--delay": `${(index % 6) * 22}ms`,
                "--w": `${2 + (index % 3)}px`,
                "--h": `${15 + ((index * 11) % 28)}px`,
              } as CSSProperties}
            />
          ))}
          <b />
        </div>

        <div className="poster-copy">
          <div className="poster-copy-inner">
            <div className="hero-brand-lockup">
              <span className="hero-brand-orbit" aria-hidden="true"><i /></span>
              <BrandEmblem />
              <p className="poster-edition">מהדורת אירועים / 2026</p>
              <h1 id="hero-title" className="sr-only">הטאבון הנודד — טאבון נייד לאירועים</h1>
            </div>
            <div className="brand-strike" aria-hidden="true" />
            <p className="poster-slogan">
              <span>
                <span className="slogan-word" style={{ "--wi": 0 } as CSSProperties}>האש</span>{" "}
                <span className="slogan-word" style={{ "--wi": 1 } as CSSProperties}>נדלקת.</span>
              </span>
              <strong>
                <span className="slogan-word" style={{ "--wi": 2 } as CSSProperties}>האירוע</span>{" "}
                <span className="slogan-word" style={{ "--wi": 3 } as CSSProperties}>מתחיל.</span>
              </strong>
            </p>
            <p className="poster-body">
              טאבון שמגיע אליכם, נדלק מול האורחים ומוציא פוקאצ׳ות חמות בדיוק כשהערב מתחיל לזוז.
            </p>
            <div className="poster-actions">
              <a className="poster-cta" href={mainWhatsapp} target="_blank" rel="noreferrer" data-ember-burst="12" data-ember-target=".poster-photo">
                <span>קבלו הצעה לאירוע</span><i aria-hidden="true">↙</i>
              </a>
              <a className="poster-text-link" href="#experience">כנסו לחוויה <span aria-hidden="true">↓</span></a>
            </div>
          </div>
        </div>

        <button
          className="ignition"
          type="button"
          aria-label={lit ? "הפעלת רצף ההדלקה מחדש" : "הדלקת האש באתר — לחיצה ארוכה"}
          onClick={handleIgnitionClick}
          onPointerDown={startCharge}
          onPointerUp={releaseCharge}
          onPointerLeave={releaseCharge}
          onPointerCancel={releaseCharge}
          onContextMenu={(event) => { if (!lit) event.preventDefault(); }}
        >
          <span className="ignition-charge-ring" aria-hidden="true" />
          <LottieFlame active={lit} replayKey={ignitionRun} />
          <b>{lit ? "שוב" : "הדליקו"}</b>
          <small>{lit ? "הדליקו מחדש" : "החזיקו לאש"}</small>
          {ignitionHint && !lit ? (
            <span className="ignition-hint" role="status">החזיקו את הכפתור להדלקה</span>
          ) : null}
        </button>

        <div className="poster-ticker" aria-label="יתרונות">
          <div>
            <span>נאפה במקום</span><i>◆</i><span>מבחר תוספות</span><i>◆</i>
            <span>מול האורחים</span><i>◆</i><span>לבית, לטבע ולאולם</span><i>◆</i>
            <span>נאפה במקום</span><i>◆</i><span>מבחר תוספות</span><i>◆</i>
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

      <div className="forge-seam" aria-hidden="true">
        <i /><span>LIVE FIRE — FORGED ON SITE</span><i />
      </div>

      <section
        ref={menuSectionRef}
        className="menu-lab forge-blueprint"
        id="menu"
        aria-labelledby="menu-title"
        data-phase={menuPhase}
        data-ember-zone
        data-ember-source="menu"
        data-ember-x="0.5"
        data-ember-y="0.48"
      >
        <header className="blueprint-heading" data-enter>
          <div className="section-index"><span>02</span><i /><p>מהטאבון</p></div>
          <div>
            <p className="console-kicker">מרכיבים ביד · אופים באש</p>
            <h2 id="menu-title">מרכיבים. <em>שולחים לאש.</em></h2>
            <p className="blueprint-intro">בחרו את התוספות שלכם — אנחנו כבר נדאג לחום, לבצק ולרגע שיוצא מהטאבון.</p>
          </div>
        </header>

        <div className="blueprint-phase-rail" aria-label="שלבי בניית הפוקאצ׳ה">
          <span data-active={menuPhase === "idle" || menuPhase === "demo" || menuPhase === "building"}><b>01</b> בוחרים</span>
          <i />
          <span data-active={menuPhase === "branding"}><b>02</b> שולחים לאש</span>
          <i />
          <span data-active={menuPhase === "ready"}><b>03</b> מהאש</span>
        </div>

        <p className="blueprint-side-note">סלטים, קינוחים ועוד — סוגרים יחד בשיחה</p>

        <div className="blueprint-workbench" data-enter style={enterDelay(60)}>
          {["left", "right"].map((side) => (
            <div className={`blueprint-stamp-rack blueprint-stamp-rack-${side}`} key={side} aria-label={side === "left" ? "תוספות צד ראשון" : "תוספות צד שני"}>
              {focacciaToppings.filter((item) => item.side === side).map((item) => {
                const active = selected.includes(item.label);
                return (
                  <button
                    type="button"
                    key={item.id}
                    className={active ? "is-selected" : ""}
                    aria-pressed={active}
                    onClick={(event) => toggleIngredient(item, event.currentTarget)}
                  >
                    <span className="blueprint-stamp-visual" aria-hidden="true">
                      <img src={item.stamp} alt="" width="180" height="180" loading="lazy" decoding="async" />
                    </span>
                    <b>{item.label}</b>
                    <small>{active ? "נבחר" : "הוסיפו"}</small>
                  </button>
                );
              })}
            </div>
          ))}

          <div
            ref={menuPhotoRef}
            className="menu-photo forge-blueprint-stage"
            onPointerMove={trackMenuForge}
            onPointerLeave={resetMenuForge}
          >
            <div ref={forgePeelRef} className="blueprint-canvas" aria-hidden="true">
              <div className="blueprint-grid" />
              <img className="blueprint-outline" src="/forge-blueprint/focaccia-outline.png" alt="" width="1100" height="733" loading="lazy" decoding="async" />
              <div className="blueprint-imprints">
                {selected.map((label) => {
                  const topping = focacciaToppings.find((item) => item.label === label);
                  if (!topping) return null;
                  return (
                    <img
                      key={topping.id}
                      src={topping.stamp}
                      alt=""
                      width="180"
                      height="180"
                      style={{
                        "--imprint-x": `${topping.imprint.x}%`,
                        "--imprint-y": `${topping.imprint.y}%`,
                        "--imprint-rotation": `${topping.imprint.rotation}deg`,
                      } as CSSProperties}
                    />
                  );
                })}
              </div>
            </div>

            {(menuBaking || menuBaked) ? (
              <div className="blueprint-result" aria-hidden="true">
                <img className="blueprint-baked-base" src="/forge/forge-peel-baked.png" alt="" width="1367" height="1150" decoding="async" />
                <div className="blueprint-food-mask">
                  {selected.flatMap((label) => {
                    const topping = focacciaToppings.find((item) => item.label === label);
                    if (!topping) return [];
                    return topping.placements.map((placement, index) => (
                      <img
                        key={`${topping.id}-${index}`}
                        className="blueprint-food-topping"
                        src={topping.photo}
                        alt=""
                        width="512"
                        height="512"
                        style={{
                          "--food-x": `${placement.x}%`,
                          "--food-y": `${placement.y}%`,
                          "--food-scale": placement.scale,
                          "--food-rotation": `${placement.rotation}deg`,
                        } as CSSProperties}
                      />
                    ));
                  })}
                </div>
                <i className="blueprint-char" />
                <i className="blueprint-oil" />
                <span className="blueprint-steam blueprint-steam-one" />
                <span className="blueprint-steam blueprint-steam-two" />
              </div>
            ) : null}

            <div key={menuBakeRun} className="forge-strike" aria-hidden="true">
              <div className="forge-branding-iron"><i /><span><img src="/brand/brand-camel-oven-icon-v2.webp" alt="" width="1100" height="1100" /></span></div>
              <div className="forge-burn-wave" />
              <div className="forge-impact-sparks">
                {Array.from({ length: 18 }, (_, index) => (
                  <i key={index} style={{ "--spark-angle": `${index * 20}deg`, "--spark-distance": `${64 + ((index * 17) % 94)}px` } as CSSProperties} />
                ))}
              </div>
            </div>

            <span className="blueprint-corner-mark blueprint-corner-one">נעשה במקום</span>
            <span className="blueprint-corner-mark blueprint-corner-two">אש חיה</span>
          </div>
        </div>

        <div className="blueprint-action-rail">
          <div className="blueprint-recap">
            <span><bdi>{String(selected.length).padStart(2, "0")}</bdi> תוספות</span>
            <p>{selected.length ? selected.join(" / ") : "השרטוט נקי — בחרו את החותמת הראשונה"}</p>
          </div>
          <div className="blueprint-actions">
            {menuBaked ? (
              <>
                <a className="menu-submit" href={menuHref} target="_blank" rel="noreferrer" data-ember-burst="14" data-ember-target=".forge-blueprint-stage">
                  שלחו לוואטסאפ <span aria-hidden="true">↙</span>
                </a>
                <button className="blueprint-edit-button" type="button" onClick={editMenuBuild}>שנו הרכב</button>
              </>
            ) : (
              <>
                <button className="menu-bake-button" type="button" onClick={runMenuBake} disabled={!selected.length || menuBaking}>
                  <span>{menuBaking ? "הברזל יורד…" : "חתמו באש"}</span>
                  <img src="/brand/icon-flame-v2.png" alt="" aria-hidden="true" width="320" height="320" loading="lazy" decoding="async" />
                </button>
                <button className="blueprint-clear-button" type="button" onClick={clearIngredients} disabled={!selected.length}>נקו בחירה</button>
              </>
            )}
          </div>
        </div>

        <p className="forge-live" role="status" aria-live={menuDemoRunning ? "off" : "polite"}>
          {menuBaking ? "חותמים את ההרכב באש" : menuBaked ? "הפוקאצ׳ה נחשפה ומוכנה לשיחה" : menuDemoRunning ? "הדגמת חותמות" : selected.length ? `${selected.length} תוספות נחתמו בשרטוט` : ""}
        </p>
      </section>

      <div className="forge-seam" aria-hidden="true">
        <i /><span>COAL / FLAME / STEEL</span><i />
      </div>

      <section className="events section-dark" id="events" aria-labelledby="events-title" data-ember-zone data-ember-source="events" data-ember-x="0.5" data-ember-y="0.72">
        <div className="section-index" data-enter><span>03</span><i /><p>הלוקיישן שלכם</p></div>
        <header className="events-heading" data-enter style={enterDelay(50)}>
          <picture className="events-arrival-visual" aria-hidden="true">
            <source media="(max-width: 760px)" srcSet="/campaign/events-arrival-mobile.png" />
            <img src="/campaign/events-arrival-desktop.png" alt="" width="1774" height="887" loading="lazy" decoding="async" />
          </picture>
          <div className="events-arrival-copy">
            <div className="events-forge-mark" aria-hidden="true">
              <img src="/brand/brand-camel-oven-icon-v2.webp" alt="" width="1100" height="1100" loading="lazy" decoding="async" />
              <span><b>LIVE FIRE</b><small>ON THE ROAD / 03</small></span>
              <i />
            </div>
            <h2 id="events-title">מגיעים<br /><em>לכל מקום.</em></h2>
            <p>לבית, לטבע, לאולם או לגן — אתם בוחרים איפה, אנחנו מגיעים עם האש.</p>
          </div>
        </header>
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
              data-ember-burst="8"
            >
              <img
                src={category.image}
                alt=""
                aria-hidden="true"
                width="1003"
                height="1568"
                loading="lazy"
                decoding="async"
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

      <div className="forge-seam" aria-hidden="true">
        <i /><span>THE FIRE TRAVELS</span><i />
      </div>

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
                width="1003"
                height="1568"
                decoding="async"
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

      <section className="answers" id="faq" aria-labelledby="faq-title" data-ember-zone data-ember-source="answers" data-ember-x="0.18" data-ember-y="0.62">
        <div className="answers-intro" data-enter>
          <div className="section-index section-index-dark"><span>04</span><i /><p>לפני שמדליקים</p></div>
          <h2 id="faq-title">קצר. לעניין. <em>חם.</em></h2>
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
                  data-ember-burst="4"
                  data-ember-intensity="0.6"
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
        <img
          className="final-scene-image"
          src="/campaign/final-poster-wide.webp"
          alt="אהרון מוביל גמל ואת הטאבון הנודד אל אירוע ערב"
          width="1732"
          height="908"
          loading="lazy"
          decoding="async"
        />
        <div className="final-flame-line" aria-hidden="true"><i /><i /><i /><i /></div>
          <div className="final-orange">
          <span className="final-kicker">הטאבון הנודד / LIVE FIRE</span>
          <h2 id="final-title">יש אירוע באופק?<br />בואו ניתן לו <em>אש.</em></h2>
          <span className="final-orange-copy">אנחנו מגיעים, מדליקים ואופים מול האורחים. אתם נשארים עם ערב שאי אפשר לפספס.</span>
          <a href={mainWhatsapp} target="_blank" rel="noreferrer" data-ember-burst="12" data-ember-target=".final-poster">
            <span>מדליקים את התאריך</span><i>↙</i>
          </a>
          <div className="final-contacts">
            <a href="tel:+972544669111">אהרון / <bdi>054-4669-111</bdi></a>
            <a href="tel:+972544669112">מור / <bdi>054-4669-112</bdi></a>
            <a href="mailto:hatabunhanoded@gmail.com">hatabunhanoded@gmail.com</a>
          </div>
        </div>
      </section>

      <footer className="poster-footer" data-ember-zone data-ember-source="footer" data-ember-x="0.5" data-ember-y="0.5">
        <span>תל אביב / ישראל</span>
        <span>© {new Date().getFullYear()} הטאבון הנודד</span>
        <a href="#top">חזרה לאש ↑</a>
      </footer>

      <div className="mobile-bar">
        <a href={mainWhatsapp} target="_blank" rel="noreferrer" data-ember-burst="7">WhatsApp</a>
        <a href="tel:+972544669111" data-ember-burst="6">חייגו</a>
      </div>
    </main>
  );
}
