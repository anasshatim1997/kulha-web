export type SiteLocale = "fr" | "ar" | "en";
type Pair = readonly [string, string];

type SiteCopy = {
  localeTag: string;
  dir: "ltr" | "rtl";
  nav: { customers: string; how: string; categories: string; faq: string; shops: string; login: string; signup: string; language: string; openMenu: string; closeMenu: string };
  hero: { kicker: string; title: string; rotatingTitles: readonly string[]; lead: string; primary: string; secondary: string; note: string; visualLabel: string; visualNote: string };
  how: { title: string; lead: string; steps: readonly Pair[] };
  categories: { title: string; lead: string; items: readonly Pair[] };
  trust: { eyebrow: string; title: string; lead: string; items: readonly Pair[]; pilotTitle: string; pilotBody: string; pilotPrimary: string; pilotSecondary: string };
  benefits: { title: string; lead: string; items: readonly Pair[] };
  why: { title: string; lead: string; items: readonly Pair[] };
  pickup: { title: string; lead: string; items: readonly Pair[]; note: string; noteTitle: string };
  shops: { title: string; lead: string; items: readonly Pair[]; cta: string };
  faq: { title: string; lead: string; items: readonly Pair[] };
  cta: { title: string; lead: string; primary: string; secondary: string };
  footer: { promise: string; explore: string; brand: string; help: string; how: string; categories: string; shops: string; about: string; faq: string; pickup: string; contact: string; legal: string; privacy: string; terms: string; languages: string };
};

export const siteCopy: Record<SiteLocale, SiteCopy> = {
  fr: {
    localeTag: "fr-MA", dir: "ltr",
    nav: { customers: "Pour les clients", how: "Comment ça marche", categories: "Les paniers", faq: "FAQ", shops: "Pour les commerces", login: "Connexion", signup: "Créer un compte", language: "Langue", openMenu: "Ouvrir le menu", closeMenu: "Fermer le menu" },
    hero: {
      kicker: "LES PANIERS MALINS DES COMMERCES DE VOTRE QUARTIER",
      title: "Les bons plans du quartier ont trouvé leur panier.",
      rotatingTitles: ["Les bons plans du quartier, à prix doux.", "Des paniers malins, près de chez vous.", "Le goût des bonnes affaires, sans gaspiller.", "Du bon dans le panier. Du bien dans le quartier."],
      lead: "Kulha! met en relation les habitants avec les commerces qui proposent leurs invendus alimentaires en paniers à prix réduit. Vous réservez en ligne, puis vous récupérez votre panier directement au commerce.",
      primary: "Créer mon compte", secondary: "Voir comment ça marche",
      note: "Les premières offres seront publiées après validation des commerces et de la zone pilote.",
      visualLabel: "PANIERS ANTI-GASPI", visualNote: "Réservez en ligne · Récupérez en boutique",
    },
    how: {
      title: "Trois gestes. Zéro panier oublié.",
      lead: "Un parcours simple, pensé autour des commerces de proximité et d’un retrait clair.",
      steps: [
        ["Découvrez", "Parcourez les paniers disponibles près de vous : boulangeries, cafés, restaurants et commerces participants."],
        ["Réservez", "Choisissez votre panier, vérifiez son contenu, son prix et son créneau, puis confirmez la réservation."],
        ["Récupérez", "Passez au commerce pendant le créneau indiqué et présentez votre code de retrait."],
      ],
    },
    categories: {
      title: "Les commerces qui font vivre le quartier.",
      lead: "Les paniers proposés dépendront des invendus réellement disponibles chez chaque commerce.",
      items: [["Boulangeries", "🥖"], ["Cafés & restaurants", "🥘"], ["Fruits & légumes", "🥬"], ["Épiceries & supermarchés", "🛒"]],
    },
    trust: {
      eyebrow: "AVANT DE RÉSERVER",
      title: "Vous savez exactement ce que vous choisissez.",
      lead: "Une bonne affaire, oui. Mais sans surprise sur les informations qui comptent.",
      items: [
        ["Le prix en MAD", "Le montant du panier est affiché avant de confirmer."],
        ["Le contenu annoncé", "Le commerce décrit les produits et précise les allergènes connus. Toute information inconnue reste indiquée comme non renseignée."],
        ["Une offre encore disponible", "La quantité est vérifiée au moment de la réservation."],
        ["Un commerce identifié", "Les commerces sont examinés avant de pouvoir publier leurs offres."],
        ["Où et quand le récupérer", "L’adresse du commerce et le créneau précis figurent sur chaque offre."],
        ["Le paiement expliqué", "Les modalités réellement disponibles sont indiquées avant confirmation."],
      ],
      pilotTitle: "Votre quartier sera annoncé dès qu’il sera prêt.",
      pilotBody: "KULHA! prépare son premier pilote dans une zone limitée. Les quartiers et commerces participants seront annoncés ici après validation.",
      pilotPrimary: "Créer un compte",
      pilotSecondary: "Je tiens un commerce",
    },
    benefits: {
      title: "Moins de gaspillage. Plus de bonnes trouvailles.",
      lead: "Une bonne affaire doit rester simple, transparente et utile à tout le monde.",
      items: [
        ["Des prix réduits", "Les commerces fixent le prix de leurs paniers d’invendus et affichent le montant avant réservation."],
        ["Une seconde chance pour les aliments", "Vous aidez à valoriser les produits proposés plutôt que de les laisser perdre."],
        ["Les commerces de votre quartier", "Découvrez des offres publiées par les commerces participants, près de votre quotidien."],
        ["Un retrait sans ambiguïté", "Le commerce, l’adresse, le contenu déclaré et le créneau sont visibles avant de réserver."],
      ],
    },
    why: {
      title: "Le bon plan du quartier, bon pour votre budget et moins de gaspillage.",
      lead: "Kulha! rapproche les habitants des commerces de proximité avec une expérience simple : des prix clairs, des paniers annoncés et un retrait organisé.",
      items: [
        ["Des prix qui se comprennent", "Montants affichés en dirhams, contenu annoncé par le commerce et créneau clair avant de réserver."],
        ["Proche des commerçants", "Les commerces gardent la main sur leurs paniers, leurs quantités et leurs créneaux de retrait."],
        ["La transparence d’abord", "Les prix, les quantités et les informations sont affichés clairement avant réservation."],
      ],
    },
    pickup: {
      title: "Vous réservez. Le commerce prépare. Vous passez récupérer.",
      lead: "Kulha! démarre avec un modèle de réservation et de retrait chez le commerçant, dans le créneau indiqué sur chaque offre.",
      items: [["Avant de réserver", "Consultez le prix, la description, les informations alimentaires disponibles et l’adresse du commerce."], ["Au moment du retrait", "Présentez votre code à usage unique au commerçant. Le retrait est confirmé une seule fois."], ["Pour le paiement", "Les modalités disponibles seront affichées avant confirmation. Le paiement au retrait est prévu comme solution pilote si aucun prestataire en ligne n’est validé." ]],
      noteTitle: "Réservation et retrait, en toute clarté",
      note: "Le parcours initial est volontairement simple : réservation en ligne, puis collecte au commerce. Les zones et horaires seront annoncés lorsqu’ils seront confirmés.",
    },
    shops: {
      title: "Vous tenez un commerce ? Donnez une chance à vos invendus.",
      lead: "Boulangeries, cafés, restaurants, épiceries et supermarchés peuvent manifester leur intérêt pour rejoindre le pilote KULHA!.",
      items: [["Publiez vos paniers", "Décrivez le contenu, fixez le prix et indiquez la quantité disponible."], ["Choisissez le créneau", "Définissez quand les clients peuvent venir récupérer leur réservation."], ["Validez le retrait", "Consultez vos réservations et confirmez chaque collecte avec un code unique."]],
      cta: "Découvrir l’espace commerçant",
    },
    faq: {
      title: "Les réponses, sans détour.",
      lead: "Les règles précises seront affichées sur chaque offre avant qu’une réservation soit confirmée.",
      items: [
        ["Kulha!, c’est quoi ?", "Une plateforme marocaine anti-gaspillage qui aide les commerces à proposer leurs invendus alimentaires en paniers à prix réduit."],
        ["Que verrai-je avant de réserver ?", "Le prix en MAD, le contenu déclaré, la quantité disponible, le nom et l’adresse du commerce ainsi que le créneau de retrait."],
        ["Comment se passe le paiement ?", "Les moyens de paiement réellement disponibles seront indiqués avant confirmation. Si aucun prestataire en ligne n’est validé pour le pilote, le paiement se fera au retrait."],
        ["Et si le panier n’est plus disponible ?", "La quantité est vérifiée au moment de la réservation. Une offre épuisée, expirée ou désactivée ne peut pas être réservée."],
        ["Où KULHA! sera-t-il disponible ?", "La zone pilote et les commerces participants seront annoncés une fois leur validation terminée. Nous ne promettons pas de couverture non confirmée."],
      ],
    },
    cta: { title: "La bonne affaire du quartier mérite une seconde chance.", lead: "Créez votre compte et suivez l’ouverture des premières offres KULHA!.", primary: "Rejoindre KULHA!", secondary: "Je suis commerçant" },
    footer: { promise: "Les invendus du quartier, une deuxième chance.", explore: "Découvrir", brand: "KULHA!", help: "Besoin d’aide", how: "Comment ça marche", categories: "Les paniers", shops: "Pour les commerces", about: "À propos", faq: "Questions fréquentes", pickup: "Retrait & réservation", contact: "Contact", legal: "Informations légales", privacy: "Confidentialité", terms: "Conditions d’utilisation", languages: "Langues" },
  },
  en: {
    localeTag: "en", dir: "ltr",
    nav: { customers: "For customers", how: "How it works", categories: "Explore baskets", faq: "FAQ", shops: "For shops", login: "Sign in", signup: "Create account", language: "Language", openMenu: "Open menu", closeMenu: "Close menu" },
    hero: {
      kicker: "SMART BASKETS FROM YOUR LOCAL SHOPS",
      title: "Your neighbourhood’s good finds, for less.",
      rotatingTitles: ["Good finds from your neighbourhood.", "Smart baskets. Happy prices.", "Spend better. Waste less.", "Good food is closer than you think."],
      lead: "Kulha! connects people with local shops offering surplus food in discounted baskets. Reserve online, then collect your basket directly from the shop.",
      primary: "Create an account", secondary: "How it works",
      note: "The first offers will be announced once the pilot shops and launch area are confirmed.",
      visualLabel: "SURPLUS FOOD BASKETS", visualNote: "Reserve online · Collect in store",
    },
    how: { title: "Three simple steps. Less food wasted.", lead: "A clear flow built around local shops and in-person collection.", steps: [["Discover", "Browse available baskets from bakeries, cafés, restaurants and participating shops near you."], ["Reserve", "Choose a basket, check its contents, price and collection window, then confirm."], ["Collect", "Visit the shop during the stated time and show your one-time pickup code."]] },
    categories: { title: "From the shops that make a neighbourhood.", lead: "Baskets depend on the surplus each participating shop actually has available.", items: [["Bakeries", "🥖"], ["Cafés & restaurants", "🥘"], ["Fruit & vegetables", "🥬"], ["Grocers & supermarkets", "🛒"]] },
    trust: {
      eyebrow: "BEFORE YOU RESERVE",
      title: "Know what you are choosing. No guesswork.",
      lead: "A good deal matters. So do the details behind it.",
      items: [
        ["The price in MAD", "The basket price is shown before you confirm."],
        ["Declared contents", "The shop describes what is included. Unknown food details stay marked as unknown."],
        ["Real availability", "Quantity is checked when your reservation is placed."],
        ["A verified shop account", "Shops are reviewed before they can publish offers."],
        ["Where and when to collect", "Every offer shows the shop address and a specific collection window."],
        ["Clear payment terms", "Available payment methods are shown before you confirm."],
      ],
      pilotTitle: "Your neighbourhood will be announced when it is ready.",
      pilotBody: "KULHA! is preparing its first pilot in a limited area. We will announce participating neighbourhoods and shops here once they are confirmed.",
      pilotPrimary: "Create an account",
      pilotSecondary: "I run a shop",
    },
    benefits: { title: "Less waste. More good finds.", lead: "A good deal should be simple, transparent and useful to everyone.", items: [["Lower prices", "Shops set the price of their surplus baskets and show it before you reserve."], ["Give food another chance", "Help make use of food that shops have available instead of letting it go to waste."], ["Your local shops", "Discover baskets posted by participating businesses around your neighbourhood."], ["Clear collection details", "The shop, address, declared contents and collection window are shown before booking."]] },
    why: { title: "A neighbourhood habit with more value and less waste.", lead: "Kulha! brings people and local shops together with a simple experience: clear prices, declared baskets and organised collection.", items: [["Clear before you book", "Prices in MAD, shop-declared contents and collection details are visible up front."], ["Built with shopkeepers", "Shops manage their baskets, quantities and collection windows."], ["Transparency first", "Clear prices, honest availability and useful details before you reserve."]] },
    pickup: { title: "Reserve online. The shop prepares. You collect.", lead: "Kulha! starts with reservations and collection at the shop, during the time shown on each offer.", items: [["Before reserving", "Check the price, description, available food information and shop address."], ["At collection", "Show your one-time code to the shopkeeper. A pickup can only be confirmed once."], ["Payment", "Available payment methods will be shown before confirmation. Pay-at-pickup is the pilot fallback if no online provider is approved."]] , noteTitle: "Reservations and collection, made clear", note: "The first version is intentionally simple: reserve online, then collect from the shop. Pilot areas and hours will be announced once confirmed." },
    shops: { title: "Run a shop? Give your surplus another chance.", lead: "Bakeries, cafés, restaurants, grocers and supermarkets can register their interest in joining the KULHA! pilot.", items: [["Publish baskets", "Describe the contents, set a price and enter the available quantity."], ["Set a collection window", "Choose when customers can collect their reservations."], ["Confirm collection", "View reservations and confirm each pickup with a unique code."]], cta: "Explore the shop space" },
    faq: { title: "Straight answers to common questions.", lead: "The exact rules will be shown on each offer before a reservation is confirmed.", items: [["What is KULHA!?", "A Moroccan food-waste marketplace helping local shops offer surplus food in discounted baskets."], ["What can I check before booking?", "The price in MAD, declared basket contents, available quantity, shop name and address, and collection window."], ["How does payment work?", "Available payment methods are shown before confirmation. If no online provider is approved for the pilot, payment is made at pickup."], ["What if a basket is no longer available?", "Availability is checked when you request a reservation. Sold-out, expired or inactive offers cannot be booked."], ["Where will KULHA! be available?", "The pilot area and participating shops will be announced once confirmed. We will not claim coverage that is not verified."]] },
    cta: { title: "A good neighbourhood find deserves another chance.", lead: "Create an account and follow the launch of the first KULHA! offers.", primary: "Join KULHA!", secondary: "I run a shop" },
    footer: { promise: "Neighbourhood surplus, given a second chance.", explore: "Explore", brand: "KULHA!", help: "Need help", how: "How it works", categories: "Explore baskets", shops: "For shops", about: "About", faq: "Frequently asked questions", pickup: "Pickup & reservations", contact: "Contact", legal: "Legal information", privacy: "Privacy", terms: "Terms of use", languages: "Languages" },
  },
  ar: {
    localeTag: "ar-MA", dir: "rtl",
    nav: { customers: "للزبائن", how: "كيف تعمل المنصة", categories: "السلال", faq: "الأسئلة الشائعة", shops: "للمتاجر", login: "تسجيل الدخول", signup: "إنشاء حساب", language: "اللغة", openMenu: "فتح القائمة", closeMenu: "إغلاق القائمة" },
    hero: {
      kicker: "سلال مميزة من متاجر الحي",
      title: "خيرات الحي في سلتك، بسعر ألطف.",
      rotatingTitles: ["خيرات الحي في سلتك، بسعر ألطف.", "سلال ذكية، وأسعار مناسبة.", "هدر أقل، واكتشافات أجمل.", "الخير قريب منك."],
      lead: "تجمع KULHA! السكان بالمتاجر المحلية التي تعرض منتجاتها الغذائية المتاحة في سلال بأسعار مخفضة. احجز عبر الموقع، ثم استلم سلتك من المتجر خلال الموعد المحدد.",
      primary: "إنشاء حساب", secondary: "اكتشف كيف تعمل",
      note: "سيتم الإعلان عن أولى العروض بعد اعتماد المتاجر وتحديد منطقة التجربة.",
      visualLabel: "سلال غذائية بأسعار مخفضة", visualNote: "احجز عبر الموقع · استلم من المتجر",
    },
    how: { title: "ثلاث خطوات بسيطة، وهدر أقل.", lead: "تجربة واضحة تربطك بالمتاجر القريبة وتحدد موعد الاستلام مسبقاً.", steps: [["اكتشف", "تصفح السلال التي تعرضها المخابز والمقاهي والمطاعم والمتاجر المشاركة."], ["احجز", "اختر السلة، وراجع محتواها وسعرها وموعد استلامها، ثم أكد الحجز."], ["استلم", "توجه إلى المتجر خلال الموعد المحدد وقدم رمز الاستلام الخاص بك."]] },
    categories: { title: "من المتاجر التي تمنح الحي نكهته.", lead: "تختلف السلال حسب المنتجات والكميات المتاحة فعلياً لدى كل متجر مشارك.", items: [["المخابز", "🥖"], ["المقاهي والمطاعم", "🥘"], ["الفواكه والخضروات", "🥬"], ["متاجر المواد الغذائية", "🛒"]] },
    trust: {
      eyebrow: "قبل الحجز",
      title: "كل التفاصيل المهمة واضحة أمامك.",
      lead: "السعر والمحتوى والمتجر وموعد الاستلام؛ معلومات أساسية قبل اتخاذ قرارك.",
      items: [
        ["السعر بالدرهم", "يظهر ثمن السلة بالدرهم المغربي قبل تأكيد الحجز."],
        ["محتوى السلة", "يوضح المتجر المنتجات ومسببات الحساسية المعروفة. وتبقى أي معلومات غير مؤكدة محددة على أنها غير متوفرة، ولا يتم تخمينها."],
        ["توفر حقيقي", "تتم مراجعة الكمية المتاحة عند إرسال طلب الحجز."],
        ["متجر تم التحقق منه", "تتم مراجعة حساب المتجر قبل السماح له بنشر العروض."],
        ["العنوان وموعد الاستلام", "يتضمن كل عرض عنوان المتجر والفترة المحددة للاستلام."],
        ["شروط دفع واضحة", "تظهر وسائل الدفع المتاحة فعلياً قبل تأكيد الحجز."],
      ],
      pilotTitle: "سنعلن عن منطقتك عند جاهزية الانطلاق.",
      pilotBody: "تستعد KULHA! لإطلاق تجربتها الأولى في منطقة محدودة. سنعلن هنا عن الأحياء والمتاجر المشاركة بعد تأكيدها.",
      pilotPrimary: "إنشاء حساب",
      pilotSecondary: "لدي متجر",
    },
    benefits: { title: "هدر أقل، واكتشافات محلية أكثر.", lead: "نريد أن تكون التجربة بسيطة وواضحة ومفيدة للسكان والمتاجر معاً.", items: [["أسعار مخفضة", "يحدد كل متجر سعر سلته، ويظهر السعر قبل الحجز."], ["فرصة ثانية للمنتجات", "تساعد على الاستفادة من المنتجات الغذائية المتاحة بدلاً من إهدارها."], ["متاجر قريبة منك", "اكتشف عروض المخابز والمقاهي والمطاعم والمتاجر المشاركة."], ["استلام واضح", "تظهر هوية المتجر وعنوانه ومحتوى السلة وموعد الاستلام قبل الحجز."]] },
    why: { title: "عادة من الحي، بقيمة أكبر وهدر أقل.", lead: "تجمع KULHA! السكان بالمتاجر المحلية من خلال تجربة بسيطة: أسعار واضحة، ومحتوى معلن، واستلام منظم.", items: [["وضوح قبل الحجز", "تظهر الأسعار بالدرهم ومحتويات السلة وموعد الاستلام قبل التأكيد."], ["بالتعاون مع التجار", "يحدد المتجر محتوى السلة وكميتها وموعد استلامها."], ["الوضوح أولاً", "تُعرض الأسعار والكميات والمعلومات المهمة قبل الحجز."]] },
    pickup: { title: "احجز عبر الموقع، واستلم من المتجر.", lead: "يعتمد نموذج KULHA! على الحجز المسبق واستلام السلة من المتجر خلال الفترة المحددة في العرض.", items: [["قبل الحجز", "راجع السعر والوصف والمعلومات الغذائية المتاحة وعنوان المتجر."], ["عند الاستلام", "قدم رمز الاستلام الذي يستخدم مرة واحدة ليؤكد المتجر عملية الاستلام."], ["الدفع", "تظهر وسائل الدفع المعتمدة قبل التأكيد. وفي حال عدم اعتماد وسيلة دفع إلكترونية خلال التجربة، يكون الدفع عند الاستلام."]] , noteTitle: "الحجز والاستلام بكل وضوح", note: "ستبدأ التجربة بطريقة بسيطة: حجز عبر الموقع ثم استلام من المتجر. وسيتم الإعلان عن المناطق والمواعيد بعد اعتمادها." },
    shops: { title: "هل تدير متجراً؟ امنح منتجاتك المتبقية فرصة أخرى.", lead: "يمكن للمخابز والمقاهي والمطاعم ومتاجر المواد الغذائية التعبير عن اهتمامها بالمشاركة في تجربة KULHA!.", items: [["انشر سلالك", "صف المنتجات وحدد السعر والكمية المتاحة."], ["حدد موعد الاستلام", "اختر الفترة التي يستطيع فيها الزبائن استلام حجوزاتهم."], ["أكد عملية الاستلام", "تابع الحجوزات وأكد كل عملية باستخدام رمز فريد."]] , cta: "اكتشف مساحة المتاجر" },
    faq: { title: "إجابات واضحة عن الأسئلة الشائعة.", lead: "ستظهر القواعد والتفاصيل الخاصة بكل سلة قبل تأكيد الحجز.", items: [["ما هي KULHA!؟", "منصة مغربية تساعد المتاجر المحلية على عرض منتجاتها الغذائية المتاحة في سلال بأسعار مخفضة."], ["ما المعلومات التي سأراها قبل الحجز؟", "السعر بالدرهم المغربي، ومحتوى السلة المعلن، والكمية المتاحة، واسم المتجر وعنوانه، وموعد الاستلام."], ["كيف يتم الدفع؟", "تظهر وسائل الدفع المتاحة قبل تأكيد الحجز. وإذا لم تعتمد وسيلة دفع إلكترونية خلال التجربة، يتم الدفع عند الاستلام."], ["ماذا لو لم تعد السلة متاحة؟", "تتم مراجعة الكمية عند طلب الحجز. ولا يمكن حجز عرض نفدت كميته أو انتهت صلاحيته أو تم إيقافه."], ["أين ستكون KULHA! متاحة؟", "سيتم الإعلان عن منطقة التجربة والمتاجر المشاركة بعد تأكيدها. ولن نعلن عن توفر الخدمة في منطقة قبل التحقق من ذلك."]] },
    cta: { title: "خيرات الحي تستحق فرصة جديدة.", lead: "أنشئ حساباً وتابع الاستعداد لإطلاق أول عروض KULHA!.", primary: "انضم إلى KULHA!", secondary: "أدير متجراً" },
    footer: { promise: "منتجات الحي المتاحة، فرصة جديدة.", explore: "اكتشف", brand: "KULHA!", help: "هل تحتاج إلى مساعدة؟", how: "كيف تعمل المنصة", categories: "السلال", shops: "للمتاجر", about: "عن KULHA!", faq: "الأسئلة الشائعة", pickup: "الحجز والاستلام", contact: "اتصل بنا", legal: "معلومات قانونية", privacy: "الخصوصية", terms: "شروط الاستخدام", languages: "اللغات" },
  },
};
