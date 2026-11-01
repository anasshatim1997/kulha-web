"use client";

import Link from "next/link";
import { useState } from "react";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import { localePath } from "@/lib/navigation";

type Audience = "customer" | "merchant";
type Category = "bakery" | "produce" | "cafe";

const copy = {
  fr: {
    kicker: "À VOUS DE JOUER",
    title: "Voyez comment KULHA! peut faire la différence.",
    lead: "Explorez un exemple côté client ou côté commerce. Les montants servent à comprendre le fonctionnement ; ce ne sont pas des offres publiées ni des prix garantis.",
    customer: "Je cherche un panier",
    merchant: "Je tiens un commerce",
    demo: "PARCOURS INTERACTIF · EXEMPLE DE PRÉSENTATION",
    customerTitle: "Un panier du quartier, à meilleur prix.",
    customerLead: "Choisissez un type de panier, comparez son prix indicatif, puis suivez le parcours jusqu'à la création de compte.",
    category: { bakery: "Boulangerie", produce: "Fruits & légumes", cafe: "Café & traiteur" },
    basket: { bakery: "Panier surprise boulangerie", produce: "Panier de saison", cafe: "Panier pause gourmande" },
    basketDetails: { bakery: "Pain, viennoiseries et douceurs selon les disponibilités du commerce.", produce: "Une sélection de fruits et légumes disponibles chez le commerce.", cafe: "Une sélection du jour préparée par un café ou un commerce de restauration." },
    regular: "Valeur indicative habituelle",
    kulhaPrice: "Exemple de prix KULHA!",
    save: "Économie indicative",
    mad: "DH",
    stageLabels: ["Découvrir", "Comparer", "Préparer", "Continuer"],
    stages: [
      { title: "Trouvez votre envie", body: "Choisissez une catégorie pour voir à quoi pourrait ressembler un panier près de chez vous." },
      { title: "Le prix, sans surprise", body: "Le prix réduit est affiché avant toute réservation. Vous voyez aussi le contenu déclaré et les informations utiles." },
      { title: "Vous savez où et quand", body: "Avant de confirmer, consultez le commerce, son adresse et le créneau de retrait. Aucune réservation n’est effectuée dans cet aperçu." },
      { title: "Prêt à découvrir les vraies offres ?", body: "Créez votre compte pour suivre le lancement et retrouver les paniers réellement publiés dans votre zone, dès leur disponibilité." },
    ],
    back: "Précédent", next: "Étape suivante", signUp: "Créer mon compte et découvrir les paniers", startOver: "Recommencer",
    sampleShop: "Commerce de quartier · exemple", collection: "Créneau de retrait", collectionTime: "À définir par le commerce", basketContents: "Contenu indicatif", notLive: "Aucune réservation réelle n’est effectuée dans cet aperçu.",
    merchantTitle: "Transformez vos produits disponibles en paniers.",
    merchantLead: "Testez la création d'une offre : estimez sa valeur, fixez votre prix, indiquez la quantité, puis visualisez ce que verra un client.",
    merchantStages: ["Composer", "Fixer le prix", "Prévisualiser"],
    productType: "Type de panier", value: "Valeur habituelle estimée", sale: "Prix du panier", quantity: "Paniers disponibles", total: "Ventes brutes potentielles (illustration)", discount: "Réduction affichée", pickup: "Créneau de retrait", pickupWindow: "Ex. aujourd'hui, 17 h – 19 h", preview: "Aperçu de votre offre", previewBody: "Le client verra votre prix, la quantité disponible, le contenu déclaré et le créneau de retrait.", publish: "Créer mon espace commerçant", merchantNote: "Exemple de calcul uniquement. La publication réelle intervient après validation du commerce et de son offre.",
    appKicker: "KULHA! DANS VOTRE POCHE",
    appTitle: "Une expérience mobile, des deux côtés du quartier.",
    appLead: "Le site est déjà adapté au mobile. Les applications dédiées KULHA! sont en préparation : voici ce que nous voulons rendre simple pour chacun.",
    appSoon: "APPLICATIONS DÉDIÉES EN PRÉPARATION",
    appMockup: "APERÇU ILLUSTRATIF",
    appCustomer: "Côté client", appCustomerLead: "Repérez les paniers autour de vous, comparez les prix, réservez et retrouvez votre code de retrait.",
    appMerchant: "Côté commerce", appMerchantLead: "Publiez vos paniers, ajustez les quantités, consultez les réservations et confirmez les retraits.",
    appWeb: "Le site KULHA! fonctionne sur téléphone dès maintenant.", appCustomerCta: "Créer un compte client", appMerchantCta: "Rejoindre comme commerce",
  },
  en: {
    kicker: "TRY IT YOURSELF",
    title: "See how KULHA! can make a difference.",
    lead: "Explore an example from the customer or shop-owner side. The figures are examples to show how KULHA! works, not live listings or guaranteed prices.",
    customer: "I'm looking for a basket",
    merchant: "I run a shop",
    demo: "INTERACTIVE EXPERIENCE · EXAMPLE PRICING",
    customerTitle: "A neighbourhood basket, for a better price.",
    customerLead: "Choose a basket type, compare an example price, then follow the journey through to account creation.",
    category: { bakery: "Bakery", produce: "Fruit & veg", cafe: "Café & deli" },
    basket: { bakery: "Bakery surprise basket", produce: "Seasonal produce basket", cafe: "A little treat basket" },
    basketDetails: { bakery: "Bread, pastries and treats depending on what the shop has available.", produce: "A selection of available fruit and vegetables from the shop.", cafe: "A daily selection prepared by a café or food business." },
    regular: "Illustrative usual value",
    kulhaPrice: "Example KULHA! price",
    save: "Illustrative saving",
    mad: "MAD",
    stageLabels: ["Discover", "Compare", "Get ready", "Continue"],
    stages: [
      { title: "Find what you're craving", body: "Choose a category to see what a basket near you could look like." },
      { title: "The price, upfront", body: "The reduced price is shown before you reserve. You can also review the declared contents and useful details." },
      { title: "Know where and when", body: "Before confirming, check the shop, address and collection window. No reservation is made in this preview." },
      { title: "Ready to discover real offers?", body: "Create an account to follow the launch and find baskets actually posted in your area when they become available." },
    ],
    back: "Back", next: "Next step", signUp: "Create an account and discover baskets", startOver: "Start again",
    sampleShop: "Neighbourhood shop · example", collection: "Collection window", collectionTime: "Set by the shop", basketContents: "Illustrative contents", notLive: "No real offer is reserved or sold in this preview.",
    merchantTitle: "Turn available food into baskets.",
    merchantLead: "Try creating an offer: estimate its value, set your price, add the quantity, then preview what a customer could see.",
    merchantStages: ["Build", "Price it", "Preview"],
    productType: "Basket type", value: "Estimated usual value", sale: "Basket price", quantity: "Baskets available", total: "Potential gross sales (illustration)", discount: "Displayed reduction", pickup: "Collection window", pickupWindow: "e.g. today, 5–7 pm", preview: "Your offer preview", previewBody: "Customers will see your price, available quantity, declared contents and collection window.", publish: "Create my shop space", merchantNote: "Calculation example only. Real offers are published after the shop and offer have been approved.",
    appKicker: "KULHA! IN YOUR POCKET",
    appTitle: "A mobile experience for both sides of the neighbourhood.",
    appLead: "The website already adapts to mobile. Dedicated KULHA! apps are in preparation—here's what we want to make simple for everyone.",
    appSoon: "DEDICATED APPS IN PREPARATION",
    appMockup: "ILLUSTRATIVE PREVIEW",
    appCustomer: "For customers", appCustomerLead: "Find baskets nearby, compare prices, reserve and keep your collection code close at hand.",
    appMerchant: "For shops", appMerchantLead: "Publish baskets, update quantities, view reservations and confirm collections.",
    appWeb: "The KULHA! website already works on your phone.", appCustomerCta: "Create a customer account", appMerchantCta: "Join as a shop",
  },
  ar: {
    kicker: "جرّب بنفسك",
    title: "اكتشف كيف تصنع KULHA! فرقاً حقيقياً.",
    lead: "استكشف تجربة من جهة الزبون أو التاجر. الأسعار للتوضيح وفهم طريقة العمل، وليست عروضاً منشورة أو أسعاراً مضمونة.",
    customer: "أبحث عن سلة",
    merchant: "أدير متجراً",
    demo: "تجربة تفاعلية · مثال توضيحي",
    customerTitle: "سلة من متاجر الحي بسعر أفضل.",
    customerLead: "اختر نوع السلة، وقارن سعراً توضيحياً، ثم تابع الخطوات حتى إنشاء الحساب.",
    category: { bakery: "مخبوزات", produce: "فواكه وخضروات", cafe: "مقهى ومأكولات" },
    basket: { bakery: "سلة المخبوزات المتنوعة", produce: "سلة منتجات الموسم", cafe: "سلة استراحة لذيذة" },
    basketDetails: { bakery: "خبز ومعجنات وحلويات حسب المنتجات المتاحة لدى المتجر.", produce: "تشكيلة من الفواكه والخضروات المتاحة لدى المتجر.", cafe: "تشكيلة يومية يجهزها مقهى أو متجر للأطعمة." },
    regular: "قيمة معتادة توضيحية",
    kulhaPrice: "سعر KULHA! التوضيحي",
    save: "التوفير التوضيحي",
    mad: "درهم",
    stageLabels: ["اكتشف", "قارن", "استعد", "تابع"],
    stages: [
      { title: "اختر ما تشتهيه", body: "اختر فئة لترى مثالاً لما قد تحتويه سلة من متجر قريب منك." },
      { title: "السعر واضح مسبقاً", body: "يظهر السعر المخفض قبل الحجز. ويمكنك أيضاً مراجعة المحتويات المعلنة والتفاصيل المهمة." },
      { title: "اعرف المكان والموعد", body: "قبل التأكيد، راجع المتجر وعنوانه وموعد الاستلام. لا يتم حجز أي سلة في هذا العرض التوضيحي." },
      { title: "هل أنت مستعد لاكتشاف العروض الحقيقية؟", body: "أنشئ حساباً لمتابعة الإطلاق واكتشاف السلال المنشورة فعلياً في منطقتك عند توفرها." },
    ],
    back: "السابق", next: "الخطوة التالية", signUp: "أنشئ حساباً واكتشف السلال", startOver: "ابدأ من جديد",
    sampleShop: "متجر من الحي · مثال", collection: "موعد الاستلام", collectionTime: "يحدده المتجر", basketContents: "محتويات توضيحية", notLive: "لا يتم حجز أو بيع أي عرض حقيقي هنا.",
    merchantTitle: "حوّل المنتجات المتاحة إلى سلال.",
    merchantLead: "جرّب إعداد عرض: قدّر قيمته، وحدد سعرك وكميته، ثم شاهد كيف سيظهر للزبائن.",
    merchantStages: ["جهّز السلة", "حدد السعر", "معاينة"],
    productType: "نوع السلة", value: "القيمة المعتادة المقدرة", sale: "سعر السلة", quantity: "عدد السلال المتاحة", total: "إجمالي المبيعات المحتمل (تقديري)", discount: "نسبة التخفيض الظاهرة", pickup: "موعد الاستلام", pickupWindow: "مثال: اليوم، 17:00–19:00", preview: "معاينة العرض", previewBody: "سيرى الزبون السعر والكمية المتاحة والمحتويات المعلنة وموعد الاستلام.", publish: "إنشاء مساحة التاجر", merchantNote: "مثال حسابي فقط. لا تُنشر العروض الفعلية إلا بعد اعتماد المتجر والعرض.",
    appKicker: "KULHA! في جيبك",
    appTitle: "تجربة على الهاتف للزبائن والتجار معاً.",
    appLead: "الموقع متوافق مع الهواتف بالفعل. تطبيقات KULHA! المخصصة قيد الإعداد، وهذه أهم الخدمات التي نعمل على تبسيطها للجميع.",
    appSoon: "التطبيقات المخصصة قيد الإعداد",
    appMockup: "معاينة توضيحية",
    appCustomer: "للزبائن", appCustomerLead: "اكتشف السلال القريبة، وقارن الأسعار، واحجز واحتفظ برمز الاستلام في متناولك.",
    appMerchant: "للمتاجر", appMerchantLead: "انشر السلال، وحدّث الكميات، وراجع الحجوزات وأكد عمليات الاستلام.",
    appWeb: "موقع KULHA! يعمل على هاتفك بالفعل.", appCustomerCta: "إنشاء حساب زبون", appMerchantCta: "الانضمام كمتجر",
  },
} as const;

const priceExamples: Record<Category, { usual: number; kulha: number }> = {
  bakery: { usual: 60, kulha: 30 },
  produce: { usual: 70, kulha: 35 },
  cafe: { usual: 50, kulha: 25 },
};

export function MarketplacePlayground({ locale }: { locale: SiteLocale }) {
  const t = copy[locale];
  const rtl = locale === "ar";
  const [audience, setAudience] = useState<Audience>("customer");
  const [category, setCategory] = useState<Category>("bakery");
  const [customerStep, setCustomerStep] = useState(0);
  const [merchantStep, setMerchantStep] = useState(0);
  const [usualValue, setUsualValue] = useState(80);
  const [basketPrice, setBasketPrice] = useState(40);
  const [quantity, setQuantity] = useState(4);
  const [appAudience, setAppAudience] = useState<Audience>("customer");

  const example = priceExamples[category];
  const exampleSaving = Math.max(0, example.usual - example.kulha);
  const discount = usualValue > 0 ? Math.max(0, Math.min(100, Math.round((1 - basketPrice / usualValue) * 100))) : 0;
  const potentialSales = basketPrice * quantity;
  const formatMoney = (value: number) => `${value.toLocaleString(locale === "ar" ? "ar-MA" : locale === "en" ? "en-MA" : "fr-MA")} ${t.mad}`;
  const registerHref = localePath(locale, "/register?source=landing");
  const shopsHref = localePath(locale, "/for-shops?source=landing");

  return (
    <>
      <section className="section marketplace-playground" id="try-kulha" dir={rtl ? "rtl" : "ltr"} aria-labelledby="playground-title">
        <div className="section-heading playground-heading">
          <p className="section-kicker">{t.kicker}</p>
          <h2 id="playground-title">{t.title}</h2>
          <p>{t.lead}</p>
        </div>

        <div className="playground-shell">
          <div className="playground-audience-switch" role="tablist" aria-label={locale === "ar" ? "اختر نوع التجربة" : locale === "en" ? "Choose a demo" : "Choisir un parcours"}>
            <button type="button" role="tab" aria-selected={audience === "customer"} className={audience === "customer" ? "is-active" : ""} onClick={() => setAudience("customer")}> <span aria-hidden="true">🧺</span>{t.customer}</button>
            <button type="button" role="tab" aria-selected={audience === "merchant"} className={audience === "merchant" ? "is-active" : ""} onClick={() => setAudience("merchant")}> <span aria-hidden="true">🏪</span>{t.merchant}</button>
          </div>

          {audience === "customer" ? (
            <div className="playground-panel" role="tabpanel">
              <div className="playground-panel-head">
                <div><span className="playground-demo-label">{t.demo}</span><h3>{t.customerTitle}</h3><p>{t.customerLead}</p></div>
                <span className="playground-sticker" aria-hidden="true">K!</span>
              </div>
              <div className="playground-stepper" aria-label={t.stageLabels.join(" · ")}>
                {t.stageLabels.map((label, index) => <button type="button" key={label} className={customerStep === index ? "is-current" : customerStep > index ? "is-done" : ""} aria-current={customerStep === index ? "step" : undefined} onClick={() => setCustomerStep(index)}><i>{customerStep > index ? "✓" : index + 1}</i><span>{label}</span></button>)}
              </div>
              <div className="playground-customer-layout">
                <div className="playground-stage-copy">
                  <span className="playground-stage-count">{String(customerStep + 1).padStart(2, "0")} / 04</span>
                  <h4>{t.stages[customerStep].title}</h4><p>{t.stages[customerStep].body}</p>
                  {customerStep === 0 && <div className="playground-category-list">{(Object.keys(t.category) as Category[]).map((key) => <button type="button" key={key} className={category === key ? "is-selected" : ""} onClick={() => setCategory(key)}><span aria-hidden="true">{key === "bakery" ? "🥖" : key === "produce" ? "🥬" : "☕"}</span>{t.category[key]}<b>{category === key ? "✓" : "＋"}</b></button>)}</div>}
                  {customerStep === 2 && <div className="playground-detail-list"><p><b>⌂</b>{t.sampleShop}</p><p><b>◷</b>{t.collection}: {t.collectionTime}</p><p><b>▤</b>{t.basketContents}: {t.basketDetails[category]}</p></div>}
                  {customerStep === 3 && <Link href={registerHref} className="button button-yellow playground-cta">{t.signUp}<span aria-hidden="true">↗</span></Link>}
                  <div className="playground-step-actions">{customerStep > 0 && <button type="button" className="playground-back" onClick={() => setCustomerStep((value) => Math.max(0, value - 1))}>← {t.back}</button>}{customerStep < 3 && <button type="button" className="button button-yellow" onClick={() => setCustomerStep((value) => Math.min(3, value + 1))}>{t.next}<span aria-hidden="true">→</span></button>}{customerStep === 3 && <button type="button" className="playground-back" onClick={() => setCustomerStep(0)}>{t.startOver}</button>}</div>
                </div>
                <article className="playground-offer-card">
                  <div className="playground-offer-image" aria-hidden="true"><span>{category === "bakery" ? "🥖" : category === "produce" ? "🥬" : "🥐"}</span><i>KULHA!</i></div>
                  <div className="playground-offer-body">
                    <span className="playground-example-tag">{t.demo}</span>
                    <h4>{t.basket[category]}</h4><p>{t.basketDetails[category]}</p>
                    <div className="playground-price-row"><div><small>{t.regular}</small><del>{formatMoney(example.usual)}</del></div><div className="playground-price-main"><small>{t.kulhaPrice}</small><strong>{formatMoney(example.kulha)}</strong></div></div>
                    <div className="playground-saving-row"><span>{t.save}</span><strong>{formatMoney(exampleSaving)}</strong><em>-{Math.round((exampleSaving / example.usual) * 100)}%</em></div>
                    <p className="playground-offer-foot">{t.notLive}</p>
                  </div>
                </article>
              </div>
            </div>
          ) : (
            <div className="playground-panel merchant-playground-panel" role="tabpanel">
              <div className="playground-panel-head">
                <div><span className="playground-demo-label">{t.demo}</span><h3>{t.merchantTitle}</h3><p>{t.merchantLead}</p></div>
                <span className="playground-sticker merchant-sticker" aria-hidden="true">MAD</span>
              </div>
              <div className="playground-stepper merchant-stepper" aria-label={t.merchantStages.join(" · ")}>
                {t.merchantStages.map((label, index) => <button type="button" key={label} className={merchantStep === index ? "is-current" : merchantStep > index ? "is-done" : ""} aria-current={merchantStep === index ? "step" : undefined} onClick={() => setMerchantStep(index)}><i>{merchantStep > index ? "✓" : index + 1}</i><span>{label}</span></button>)}
              </div>
              <div className="merchant-demo-grid">
                <div className="merchant-controls">
                  <span className="playground-stage-count">{String(merchantStep + 1).padStart(2, "0")} / 03</span>
                  <h4>{t.merchantStages[merchantStep]}</h4>
                  <label className="demo-field"><span>{t.productType}</span><select value={category} onChange={(event) => setCategory(event.target.value as Category)}><option value="bakery">{t.category.bakery}</option><option value="produce">{t.category.produce}</option><option value="cafe">{t.category.cafe}</option></select></label>
                  {merchantStep > 0 && <><label className="demo-field"><span>{t.value} ({t.mad})</span><input type="number" min="1" max="1000" value={usualValue} onChange={(event) => setUsualValue(Math.max(1, Number(event.target.value) || 1))}/></label><label className="demo-field"><span>{t.sale} ({t.mad})</span><input type="number" min="1" max="1000" value={basketPrice} onChange={(event) => setBasketPrice(Math.max(1, Number(event.target.value) || 1))}/></label><label className="demo-field"><span>{t.quantity}: <strong>{quantity}</strong></span><input type="range" min="1" max="20" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))}/></label></>}
                  {merchantStep === 2 && <div className="merchant-window-note"><span>◷</span><div><b>{t.pickup}</b><small>{t.pickupWindow}</small></div></div>}
                  <div className="playground-step-actions">{merchantStep > 0 && <button type="button" className="playground-back" onClick={() => setMerchantStep((value) => Math.max(0, value - 1))}>← {t.back}</button>}{merchantStep < 2 ? <button type="button" className="button button-yellow" onClick={() => setMerchantStep((value) => Math.min(2, value + 1))}>{t.next}<span aria-hidden="true">→</span></button> : <Link href={shopsHref} className="button button-yellow playground-cta">{t.publish}<span aria-hidden="true">↗</span></Link>}</div>
                </div>
                <article className="merchant-preview-card">
                  <div className="merchant-preview-top"><span>✳ KULHA!</span><small>{t.demo}</small></div>
                  <h4>{t.preview}</h4><h3>{t.basket[category]}</h3><p>{t.previewBody}</p>
                  <div className="merchant-preview-pricing"><div><small>{t.regular}</small><strong>{formatMoney(usualValue)}</strong></div><div><small>{t.sale}</small><strong>{formatMoney(basketPrice)}</strong></div></div>
                  <div className="merchant-metrics"><div><small>{t.discount}</small><strong>{discount}%</strong></div><div><small>{t.quantity}</small><strong>{quantity}</strong></div><div><small>{t.total}</small><strong>{formatMoney(potentialSales)}</strong></div></div>
                  <p className="merchant-note">{t.merchantNote}</p>
                </article>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="section mobile-app-showcase" id="mobile-app" dir={rtl ? "rtl" : "ltr"} aria-labelledby="mobile-app-title">
        <div className="mobile-app-heading"><div><p className="section-kicker">{t.appKicker}</p><h2 id="mobile-app-title">{t.appTitle}</h2><p>{t.appLead}</p></div><span className="app-coming-soon">✳ {t.appSoon}</span></div>
        <div className="mobile-app-switch" role="tablist" aria-label={locale === "ar" ? "اختر تطبيق الهاتف" : locale === "en" ? "Choose the app view" : "Choisir l’application"}>
          <button type="button" role="tab" aria-selected={appAudience === "customer"} className={appAudience === "customer" ? "is-active" : ""} onClick={() => setAppAudience("customer")}>🧺 {t.appCustomer}</button>
          <button type="button" role="tab" aria-selected={appAudience === "merchant"} className={appAudience === "merchant" ? "is-active" : ""} onClick={() => setAppAudience("merchant")}>🏪 {t.appMerchant}</button>
        </div>
        <div className={`mobile-app-feature ${appAudience === "merchant" ? "is-merchant" : "is-customer"}`} key={appAudience} role="tabpanel">
          <div className="mobile-app-feature-copy">
            <span className="mobile-app-audience">{appAudience === "customer" ? `01 / ${t.appCustomer}` : `02 / ${t.appMerchant}`}</span>
            <h3>{appAudience === "customer" ? t.appCustomer : t.appMerchant}</h3>
            <p>{appAudience === "customer" ? t.appCustomerLead : t.appMerchantLead}</p>
            <ul>
              {(appAudience === "customer" ? (locale === "ar" ? ["اكتشف السلال القريبة", "قارن الأسعار والمحتويات", "تابع حجوزاتك ورمز الاستلام"] : locale === "en" ? ["Discover nearby baskets", "Compare prices and contents", "Keep reservations and pickup codes handy"] : ["Découvrez les paniers à proximité", "Comparez prix et contenus", "Retrouvez réservations et codes de retrait"]) : (locale === "ar" ? ["انشر السلال بسرعة", "حدّث الكميات والأسعار", "تابع الحجوزات وعمليات الاستلام"] : locale === "en" ? ["Publish baskets in a few steps", "Update quantities and prices", "Track reservations and collections"] : ["Publiez vos paniers en quelques gestes", "Ajustez prix et quantités", "Suivez réservations et retraits"])).map((item) => <li key={item}><span>✓</span>{item}</li>)}
            </ul>
            <Link href={appAudience === "customer" ? registerHref : shopsHref} className="button button-yellow">{appAudience === "customer" ? t.appCustomerCta : t.appMerchantCta}<span aria-hidden="true">↗</span></Link>
          </div>
          <div className="mobile-app-device-wrap" aria-hidden="true">
            <div className={`app-phone app-phone-feature ${appAudience === "merchant" ? "app-phone-merchant" : ""}`}>
              <div className="app-phone-notch"/><div className="app-phone-top"><b>{appAudience === "customer" ? "KULHA!" : "KULHA! SHOP"}</b><span>{appAudience === "customer" ? "⌕" : "☰"}</span></div>
              <div className="app-phone-greeting">{appAudience === "customer" ? t.appCustomer : t.appMerchant}</div>
              <div className="app-phone-concept">{t.appMockup}</div>
              {appAudience === "customer" ? <><div className="app-phone-tile app-tile-bread"><span>🥖</span><b>{t.basket.bakery}</b><small>{formatMoney(29)}</small></div><div className="app-phone-tile app-tile-produce"><span>🥬</span><b>{t.basket.produce}</b><small>{formatMoney(39)}</small></div><div className="app-phone-tile"><span>🥐</span><b>{t.basket.cafe}</b><small>{formatMoney(25)}</small></div></> : <><div className="app-shop-stat"><small>{t.quantity}</small><strong>04</strong></div><div className="app-shop-order"><span>🥐</span><div><b>{t.basket.bakery}</b><small>{formatMoney(29)}</small></div><i>✓</i></div><div className="app-shop-order"><span>🥬</span><div><b>{t.basket.produce}</b><small>{formatMoney(39)}</small></div><i>✓</i></div></>}
              <div className="app-phone-nav"><i/> <i/> <i/> <i/></div>
            </div>
            <span className="mobile-app-orbit mobile-app-orbit-one"/><span className="mobile-app-orbit mobile-app-orbit-two"/>
          </div>
        </div>
        <p className="mobile-app-footnote"><span aria-hidden="true">✳</span>{t.appWeb}</p>
      </section>
    </>
  );
}
