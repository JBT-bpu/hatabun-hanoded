const whatsappHref =
  "https://wa.me/972544669111?text=%D7%94%D7%99%D7%99%20%D7%94%D7%98%D7%90%D7%91%D7%95%D7%9F%20%D7%94%D7%A0%D7%95%D7%93%D7%93%2C%20%D7%90%D7%A9%D7%9E%D7%97%20%D7%9C%D7%A7%D7%91%D7%9C%20%D7%94%D7%A6%D7%A2%D7%94%20%D7%9C%D7%90%D7%99%D7%A8%D7%95%D7%A2";

const menuGroups = [
  {
    label: "01 / הבסיס",
    title: "פוקאצ׳ות. חמות. עכשיו.",
    description:
      "בצק שנכנס לעיני האורחים ויוצא מהטאבון ישר להגשה — עם רטבים, צבע וטקסטורה.",
    items: [
      "זעתר ושמן זית",
      "עגבניות",
      "פסטו",
      "טפנד זיתים",
      "אנטיפסטי",
    ],
    tone: "light",
  },
  {
    label: "02 / השדרוג",
    title: "הכיוון שלכם. החלבי או הבשרי.",
    description:
      "בונים את העמדה סביב האופי של האירוע, עם אפשרויות שדרוג ותוספות שנבחרות יחד.",
    items: [
      "מוצרלה",
      "בולגרית",
      "צפתית",
      "שווארמה",
      "בשר טחון",
    ],
    tone: "ember",
  },
];

const faqs = [
  {
    question: "העמדה חלבית או בשרית?",
    answer:
      "אפשר להתאים את עמדת הטאבון לאירוע חלבי או בשרי. בשיחה הראשונה נבין את הכיוון ונתאים את האפשרויות לאירוע שלכם.",
  },
  {
    question: "הטאבון הוא האוכל המרכזי או עמדה נוספת?",
    answer:
      "הטאבון יכול להוביל את קבלת הפנים או המסיבה, ויכול גם להשתלב כעמדה חמה לצד עמדות נוספות.",
  },
  {
    question: "איפה אפשר להקים את העמדה?",
    answer:
      "בבית פרטי, בחיק הטבע, באולם או בגן אירועים. ספרו לנו איפה חוגגים ונבדוק יחד את ההתאמה למקום.",
  },
  {
    question: "איך מקבלים הצעת מחיר?",
    answer:
      "שולחים לנו בוואטסאפ תאריך, מיקום וכמה מילים על האירוע — או מתקשרים לאהרון. משם נבנה את ההצעה המתאימה.",
  },
  {
    question: "מה לגבי כשרות או אלרגנים?",
    answer:
      "את פרטי הכשרות, חומרי הגלם והאלרגנים חשוב לברר ישירות מול הצוות לפני ההזמנה, בהתאם לתפריט הנבחר.",
  },
];

export default function Home() {
  return (
    <main id="top">
      <a className="skip-link" href="#content">
        דילוג לתוכן
      </a>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-media" aria-hidden="true">
          <img src="/hero-fire.png" alt="" />
        </div>
        <div className="hero-shade" aria-hidden="true" />

        <header className="site-header">
          <a className="brand" href="#top" aria-label="הטאבון הנודד — לדף הבית">
            <span className="brand-mark">אש</span>
            <span className="brand-name">
              <strong>הטאבון</strong>
              <small>הנודד</small>
            </span>
          </a>

          <nav className="main-nav" aria-label="ניווט ראשי">
            <a href="#experience">החוויה</a>
            <a href="#menu">מה אוכלים</a>
            <a href="#events">לאן מגיעים</a>
            <a href="#faq">שאלות</a>
          </nav>

          <a className="header-contact" href={whatsappHref} target="_blank" rel="noreferrer">
            קבלו הצעה <span aria-hidden="true">↙</span>
          </a>
        </header>

        <div className="hero-inner">
          <div className="hero-copy">
            <p className="eyebrow"><span /> טאבון נייד לאירועים</p>
            <h1 id="hero-title">
              האש נדלקת.
              <em>האירוע מתחיל.</em>
            </h1>
            <p className="hero-lead">
              פוקאצ׳ות נאפות מול האורחים — חם, טרי ובלתי אפשרי להתעלם. זה לא רק אוכל. זה השואו שלכם.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href={whatsappHref} target="_blank" rel="noreferrer">
                בואו נדליק אירוע <span aria-hidden="true">←</span>
              </a>
              <a className="button button-quiet" href="tel:+972544669111">
                דברו עם אהרון <bdi>054-4669-111</bdi>
              </a>
            </div>
          </div>

          <p className="hero-signature" aria-hidden="true">
            תיאטרון <span>האש</span>
          </p>
        </div>
      </section>

      <div className="proof-strip" aria-label="יתרונות עיקריים">
        <span><i aria-hidden="true">●</i> נאפה במקום</span>
        <span><i aria-hidden="true">●</i> חלבי או בשרי</span>
        <span><i aria-hidden="true">●</i> לבית, לטבע, לאולם או לגן</span>
      </div>

      <div id="content">
        <section className="experience section" id="experience" aria-labelledby="experience-title">
          <div className="section-kicker">
            <span>01</span>
            <p>החוויה</p>
          </div>

          <div className="experience-grid">
            <div className="experience-copy">
              <p className="overline">לא עוד עמדת אוכל</p>
              <h2 id="experience-title">
                זה הרגע שבו כולם <em>מתקרבים.</em>
              </h2>
              <p className="large-copy">
                הטאבון מגיע, האש עולה והבצק מתחיל לזוז. הריח מתפזר לפני הביס הראשון — ופתאום יש לאירוע מרכז חי, חם ומסקרן.
              </p>
              <a className="text-link" href="#how-it-works">
                ככה זה קורה <span aria-hidden="true">←</span>
              </a>
            </div>

            <div className="oven-portal">
              <div className="portal-glow" aria-hidden="true" />
              <div className="portal-image">
                <img src="/hero-fire.png" alt="טאבון בוער ופוקאצ׳ה חמה מוגשת באירוע" />
              </div>
              <p className="portal-note"><span>LIVE</span> נאפה מול האורחים</p>
            </div>
          </div>

          <div className="moments-grid">
            <article className="moment-card">
              <span className="moment-number">01</span>
              <h3>מגיעים</h3>
              <p>מקימים עמדת טאבון שמרגישה חלק מהאירוע, לא תוספת מהצד.</p>
            </article>
            <article className="moment-card moment-featured">
              <span className="moment-number">02</span>
              <h3>מדליקים</h3>
              <p>האש, החום והריח פותחים את התיאבון ומושכים את כולם פנימה.</p>
            </article>
            <article className="moment-card">
              <span className="moment-number">03</span>
              <h3>אופים</h3>
              <p>הפוקאצ׳ות יוצאות חמות, עם שילובים שנבחרו לערב שלכם.</p>
            </article>
          </div>
        </section>

        <section className="menu-section section" id="menu" aria-labelledby="menu-title">
          <div className="menu-header">
            <div className="section-kicker section-kicker-light">
              <span>02</span>
              <p>מה אוכלים</p>
            </div>
            <div>
              <p className="overline">מה יוצא מהטאבון?</p>
              <h2 id="menu-title">חם. צבעוני. בלי לחכות.</h2>
            </div>
            <p className="menu-intro">
              מתחילים מפוקאצ׳ה לוהטת ומרכיבים סביבה תפריט שמתאים לאופי של האירוע.
            </p>
          </div>

          <div className="menu-grid">
            {menuGroups.map((group) => (
              <article className={`menu-card menu-card-${group.tone}`} key={group.label}>
                <p className="menu-label">{group.label}</p>
                <h3>{group.title}</h3>
                <p>{group.description}</p>
                <ul aria-label={`אפשרויות עבור ${group.title}`}>
                  {group.items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </article>
            ))}
          </div>

          <div className="menu-callout">
            <p>יש לכם כיוון משלכם?</p>
            <a href={whatsappHref} target="_blank" rel="noreferrer">
              בואו נבנה את התפריט יחד <span aria-hidden="true">←</span>
            </a>
          </div>
        </section>

        <section className="events-section section" id="events" aria-labelledby="events-title">
          <div className="events-heading">
            <div className="section-kicker">
              <span>03</span>
              <p>לאן מגיעים</p>
            </div>
            <p className="overline">הטאבון מגיע לרגע שלכם</p>
            <h2 id="events-title">אתם בוחרים איפה. אנחנו מביאים את החום.</h2>
          </div>

          <div className="event-panels">
            <article className="event-panel event-home">
              <span>01</span>
              <div>
                <p>קרוב ואישי</p>
                <h3>בבית</h3>
              </div>
            </article>
            <article className="event-panel event-nature">
              <span>02</span>
              <div>
                <p>פתוח ובלתי נשכח</p>
                <h3>בטבע</h3>
              </div>
            </article>
            <article className="event-panel event-venue">
              <span>03</span>
              <div>
                <p>עמדה עם נוכחות</p>
                <h3>באולם או בגן</h3>
              </div>
            </article>
          </div>

          <p className="events-note">
            קבלת פנים, יום הולדת, מסיבה או ערב מיוחד — ספרו לנו איפה חוגגים ונבדוק את ההתאמה לאירוע.
          </p>
        </section>

        <section className="process-section section" id="how-it-works" aria-labelledby="process-title">
          <div className="process-intro">
            <div className="section-kicker section-kicker-light">
              <span>04</span>
              <p>איך זה עובד</p>
            </div>
            <p className="overline">פשוט מתחילים לדבר</p>
            <h2 id="process-title">מהשיחה הראשונה עד הפוקאצ׳ה החמה.</h2>
          </div>

          <ol className="process-list">
            <li>
              <span>01</span>
              <div><h3>מספרים</h3><p>תאריך, מיקום ומה אתם מתכננים.</p></div>
            </li>
            <li>
              <span>02</span>
              <div><h3>מתאימים</h3><p>כיוון חלבי או בשרי והאפשרויות לערב.</p></div>
            </li>
            <li>
              <span>03</span>
              <div><h3>סוגרים</h3><p>מקבלים הצעה ברורה לפי פרטי האירוע.</p></div>
            </li>
            <li>
              <span>04</span>
              <div><h3>מדליקים</h3><p>נפגשים באירוע ואופים מול האורחים.</p></div>
            </li>
          </ol>
        </section>

        <section className="faq-section section" id="faq" aria-labelledby="faq-title">
          <div className="faq-heading">
            <div className="section-kicker">
              <span>05</span>
              <p>כדאי לדעת</p>
            </div>
            <p className="overline">שאלות שמגיעות לפני האש</p>
            <h2 id="faq-title">שאלתם. פתחנו.</h2>
          </div>

          <div className="faq-list">
            {faqs.map((faq, index) => (
              <details key={faq.question}>
                <summary>
                  <span className="faq-index">0{index + 1}</span>
                  <span>{faq.question}</span>
                  <i aria-hidden="true">+</i>
                </summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="closing" aria-labelledby="closing-title">
          <div className="closing-image" aria-hidden="true">
            <img src="/hero-fire.png" alt="" />
          </div>
          <div className="closing-shade" aria-hidden="true" />
          <div className="closing-content">
            <p className="eyebrow"><span /> מוכנים לחמם את האירוע?</p>
            <h2 id="closing-title">האירוע שלכם.<br /><em>האש שלנו.</em></h2>
            <p>שלחו לנו תאריך, מיקום וכמה מילים על מה שאתם מתכננים. נמשיך משם.</p>
            <div className="closing-actions">
              <a className="button button-primary" href={whatsappHref} target="_blank" rel="noreferrer">
                הצעה בוואטסאפ <span aria-hidden="true">←</span>
              </a>
              <a className="button button-outline" href="tel:+972544669111">
                חייגו לאהרון <bdi>054-4669-111</bdi>
              </a>
            </div>
          </div>
        </section>
      </div>

      <footer className="site-footer">
        <div className="footer-brand">
          <span className="brand-mark">אש</span>
          <p><strong>הטאבון הנודד</strong><br />תיאטרון אש נייד לאירועים</p>
        </div>
        <div className="footer-contact">
          <a href="tel:+972544669111">אהרון <bdi>054-4669-111</bdi></a>
          <a href="tel:+972544669112">מור <bdi>054-4669-112</bdi></a>
          <a href="mailto:hatabunhanoded@gmail.com">hatabunhanoded@gmail.com</a>
        </div>
        <div className="footer-meta">
          <span>תל אביב</span>
          <span>© {new Date().getFullYear()} הטאבון הנודד</span>
        </div>
      </footer>

      <div className="mobile-actions" aria-label="יצירת קשר מהירה">
        <a className="mobile-whatsapp" href={whatsappHref} target="_blank" rel="noreferrer">WhatsApp</a>
        <a className="mobile-call" href="tel:+972544669111">חייגו</a>
      </div>
    </main>
  );
}
