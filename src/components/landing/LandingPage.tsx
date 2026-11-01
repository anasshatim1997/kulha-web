import Link from "next/link";
import Image from "next/image";
import { siteCopy, type SiteLocale } from "@/lib/i18n/site-copy";
import { AnimatedHeroTitle } from "@/components/landing/AnimatedHeroTitle";
import { MarketplacePlayground } from "@/components/landing/MarketplacePlayground";
import { BasketDiscovery } from "@/components/landing/BasketDiscovery";
import { localePath } from "@/lib/navigation";

export function LandingPage({ locale = "fr" }: { locale?: SiteLocale }) {
  const t = siteCopy[locale];
  const href = (path: string) => localePath(locale, path);

  return (
    <div className={`landing locale-${locale}`} dir={t.dir} lang={t.localeTag}>
      <section className="hero-section" aria-labelledby="hero-title">
        <video
          className="hero-video"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster="/video/hero/hero1-split-logo-only_poster.jpg"
          aria-hidden="true"
        >
          <source src="/video/hero/hero1-split-logo-only.mp4" type="video/mp4" />
          <source src="/video/hero/hero1-split-logo-only.webm" type="video/webm" />
        </video>
        <div className="hero-inner">
          <div className="hero-copy" dir={t.dir}>
            <p className="eyebrow"><span className="eyebrow-dot" aria-hidden="true" />{t.hero.kicker}</p>
            <h1 id="hero-title"><AnimatedHeroTitle phrases={t.hero.rotatingTitles} /></h1>
            <p className="hero-lead">{t.hero.lead}</p>
            <div className="hero-actions">
              <Link href={href("/register")} className="button button-yellow">{t.hero.primary}<span aria-hidden="true">↗</span></Link>
              <Link href="#how" className="button button-outline">{t.hero.secondary}<span aria-hidden="true">↓</span></Link>
            </div>
            <div className="hero-proof" aria-label="Kulha pickup model">
              <span><i aria-hidden="true">✓</i>{locale === "ar" ? "حجز بسيط" : locale === "en" ? "Easy reservation" : "Réservation simple"}</span>
              <span><i aria-hidden="true">✓</i>{locale === "ar" ? "أسعار مخفضة" : locale === "en" ? "Reduced prices" : "Prix réduits"}</span>
              <span><i aria-hidden="true">✓</i>{locale === "ar" ? "الاستلام من المتجر" : locale === "en" ? "Collect in store" : "Retrait en boutique"}</span>
            </div>
            <p className="hero-note"><span aria-hidden="true">✳</span>{t.hero.note}</p>
          </div>
          <div className="hero-mobile-art" aria-hidden="true">
            <Image src="/brand/kulha-bag.png" alt="" width={1129} height={1308} priority />
          </div>
        </div>
        <div className="hero-bottomline"><span>{locale === "ar" ? "اكتشافات من متاجر الحي · أسعار ألطف · هدر أقل" : locale === "en" ? "Local food finds · better prices · less waste" : "Les bonnes trouvailles du quartier · des prix doux · moins de gaspillage"}</span><a href="#how" className="scroll-cue">{locale === "ar" ? "اكتشف كيف تعمل" : locale === "en" ? "DISCOVER HOW IT WORKS" : "DÉCOUVRIR LE CONCEPT"} <b aria-hidden="true">↓</b></a></div>
      </section>

      <BasketDiscovery locale={locale} />

      <MarketplacePlayground locale={locale} />

      <section id="how" className="section section-how">
        <div className="section-heading"><p className="section-kicker">01 / {locale === "ar" ? "بكل سهولة" : locale === "en" ? "THREE SIMPLE STEPS" : "TROIS PETITES ÉTAPES"}</p><h2>{t.how.title}</h2><p>{t.how.lead}</p></div>
        <div className="steps-grid">{t.how.steps.map((step, i) => <article className="step-card" key={step[0]}><div className="step-top"><span className="step-number">0{i + 1}</span><span className="step-symbol" aria-hidden="true">{["⌕", "＋", "↗"][i]}</span></div><h3>{step[0]}</h3><p>{step[1]}</p><div className="step-line" /></article>)}</div>
      </section>

      <section className="section faq-section" id="faq">
        <div className="faq-intro" dir={t.dir}><p className="section-kicker">05 / FAQ</p><h2>{t.faq.title}</h2><p>{t.faq.lead}</p><Link href={href("/faq")} className="text-link">{locale === "ar" ? "جميع الأسئلة" : locale === "en" ? "All questions" : "Toutes les questions"} <b aria-hidden="true">↗</b></Link></div>
        <div className="faq-list">{t.faq.items.slice(0, 5).map((item, i) => <details className="faq-item" key={item[0]} open={i === 0}><summary>{item[0]}<b aria-hidden="true">＋</b></summary><p>{item[1]}</p></details>)}</div>
        <div className="faq-cta" dir={t.dir}><div><span>KULHA! · MAROC</span><h3>{t.cta.title}</h3><p>{t.cta.lead}</p></div><Link href={href("/register")} className="button button-yellow">{t.cta.primary}<span aria-hidden="true">↗</span></Link></div>
      </section>
    </div>
  );
}
