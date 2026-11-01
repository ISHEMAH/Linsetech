export type PostCategory = "company" | "product" | "hardware" | "insights" | "press";
export type Block = { type: "p" | "h2" | "quote" | "ul"; text?: string; items?: string[] };

export type Post = {
  slug: string;
  title: string;
  category: PostCategory;
  date: string;
  readTime: number;
  excerpt: string;
  author: string;
  body: Block[];
  featured?: boolean;
  pdf?: string;
};

type Translation = { title: string; excerpt: string; body: Block[] };

/**
 * English source posts. The first five are the launch posts; the others are sample articles written from the
 * company milestones (src/content/company.ts) so the archive, filters and pagination have something to show.
 * No real people or partner companies are named. Replace them from the Studio when real posts exist.
 */
export const posts: Post[] = [
  {
    slug: "linse-launches-new-website",
    title: "Linse launches its new home on the web",
    category: "company",
    date: "2026-11-15",
    readTime: 3,
    excerpt: "A new site for a wider scope: software we build, software we own, hardware we distribute and the IT services that keep it all running.",
    author: "Linse",
    featured: true,
    body: [
      { type: "p", text: "Today we are launching a new website that reflects what Linse has become: a company that designs and builds software, publishes its own products, distributes hardware and runs IT for organisations that need all of it to work together." },
      { type: "h2", text: "What is new" },
      { type: "ul", items: ["A Work section with case studies, starting with MacyePay.", "Six services, each with its own page and FAQs.", "News and insights, in English, French and Kinyarwanda."] },
      { type: "quote", text: "We wanted a site that shows how we think about products: fast, precise and built to run." },
      { type: "p", text: "If you have a project in mind, use “Start a project” anywhere on the site. We reply within two working days." },
    ],
  },
  {
    slug: "macyepay-5000-agreements",
    title: "MacyePay passes 5,000 active agreements",
    category: "product",
    date: "2026-10-02",
    readTime: 4,
    excerpt: "Our installment-payment platform now serves 200+ businesses with a 98% recovery rate. Here is what we learned.",
    author: "Linse",
    body: [
      { type: "p", text: "MacyePay crossed 5,000 active agreements this quarter, with more than RWF 500 million processed since launch." },
      { type: "h2", text: "Why recovery works" },
      { type: "p", text: "Three things: every plan is a notarised, legally binding agreement; reminders and penalties are automatic; and payment history feeds a trust score that customers want to protect." },
      { type: "p", text: "Next on the roadmap: more payment methods and a lender dashboard." },
    ],
  },
  {
    slug: "choosing-laptops-for-your-team",
    title: "How to choose laptops for a growing team",
    category: "hardware",
    date: "2026-09-10",
    readTime: 5,
    excerpt: "Warranty, serviceability and total cost matter more than the spec sheet. A practical guide from our distribution team.",
    author: "Linse",
    body: [
      { type: "p", text: "When a team grows past ten people, laptop purchasing stops being a shopping trip and becomes a policy. Here is how we help clients write that policy." },
      { type: "h2", text: "Start with warranty" },
      { type: "p", text: "A business-grade laptop with a 3-year on-site warranty costs more up front and far less over its life. Ask for the warranty terms before the specs." },
      { type: "h2", text: "Standardise" },
      { type: "p", text: "Two models, three configurations. It makes support, spares and imaging simple." },
    ],
  },
  {
    slug: "integrating-mobile-money",
    title: "Integrating mobile money: five things to get right",
    category: "insights",
    date: "2026-08-05",
    readTime: 6,
    excerpt: "Webhooks arrive late, references collide and users refresh. Lessons from building payment flows for Rwandan businesses.",
    author: "Linse",
    body: [
      { type: "p", text: "Mobile money is the default payment method for most of our clients’ customers. Integrating it well is less about the API and more about the edge cases." },
      { type: "ul", items: ["Treat every callback as possibly late or duplicated.", "Poll and reconcile; never trust a redirect alone.", "Make references unique and human-readable.", "Show the user what is happening while you wait.", "Log everything, with the provider’s reference."] },
    ],
  },
  {
    slug: "press-linse-distribution-agreement",
    title: "Press release: Linse signs regional distribution agreements",
    category: "press",
    date: "2026-07-01",
    readTime: 2,
    excerpt: "Linsetech Ltd becomes an authorised reseller for business-grade devices and networking across Rwanda.",
    author: "Linsetech Ltd",
    body: [
      { type: "p", text: "Kigali, Rwanda. Linsetech Ltd announced today that it has signed distribution agreements covering laptops, servers and networking equipment for the Rwandan market." },
      { type: "p", text: "The agreements extend the hardware line Linse opened in 2025 and give customers manufacturer warranties, local stock and on-site support from a single supplier." },
      { type: "h2", text: "About Linsetech Ltd" },
      { type: "p", text: "Linse designs and builds software, publishes its own products, distributes hardware and provides IT services from Kigali." },
    ],
  },
  {
    slug: "what-a-managed-it-contract-should-include",
    title: "What a managed IT contract should include",
    category: "insights",
    date: "2026-06-16",
    readTime: 5,
    excerpt: "Response times, scope, reporting and an exit plan: the clauses we put in every support agreement, and why.",
    author: "Linse",
    body: [
      { type: "p", text: "A managed IT contract is only as good as what it writes down. Most disputes we see come from what was assumed, not from what was agreed." },
      { type: "h2", text: "Response and resolution, by priority" },
      { type: "p", text: "Define what “critical” means for your business, then attach a response time and a resolution target to each level. A printer is not a server." },
      { type: "h2", text: "The clauses we always include" },
      { type: "ul", items: ["A named list of covered devices, users and systems.", "Monitoring and patching windows, agreed in advance.", "A monthly report with tickets, response times and risks.", "Who owns passwords, licences and documentation.", "An exit plan: how everything is handed back if you leave."] },
      { type: "p", text: "Ask for the report template before you sign. It tells you how the provider thinks about your systems." },
    ],
  },
  {
    slug: "macyepay-trust-score",
    title: "Inside the MacyePay trust score",
    category: "product",
    date: "2026-04-08",
    readTime: 4,
    excerpt: "How payment history becomes a score customers want to protect, and how merchants use it to offer better plans.",
    author: "Linse",
    body: [
      { type: "p", text: "Every MacyePay customer builds a trust score from the way they pay. It is visible to them in the app and to merchants when a new plan is proposed." },
      { type: "h2", text: "What goes into it" },
      { type: "ul", items: ["On-time payments, weighted by recency.", "Completed agreements.", "Late payments and how quickly they were settled.", "Length of history on the platform."] },
      { type: "h2", text: "Why it changes behaviour" },
      { type: "p", text: "A good score unlocks longer plans and lower deposits. Customers can see exactly what moves it, so paying on time has a visible reward." },
      { type: "quote", text: "The score is not a penalty system. It is a way for good payers to prove it." },
    ],
  },
  {
    slug: "press-linse-one-company",
    title: "Press release: Software, products, hardware and IT services under one name",
    category: "press",
    date: "2026-03-10",
    readTime: 2,
    excerpt: "Linsetech Ltd brings its four activities together under the Linse brand, with one team and one point of contact.",
    author: "Linsetech Ltd",
    body: [
      { type: "p", text: "Kigali, Rwanda. Linsetech Ltd today brought its software studio, product publishing, hardware distribution and IT services together under a single brand, Linse." },
      { type: "p", text: "Customers now work with one account team for projects that span software, devices and support, with one contract and one help desk." },
      { type: "h2", text: "About Linsetech Ltd" },
      { type: "p", text: "Linse designs and builds software, publishes its own products, distributes hardware and provides IT services from Kigali." },
    ],
  },
  {
    slug: "network-refresh-checklist",
    title: "A network refresh checklist for small offices",
    category: "hardware",
    date: "2026-01-20",
    readTime: 4,
    excerpt: "Before you replace the router: map what you have, plan the Wi-Fi, separate guests and keep spares on the shelf.",
    author: "Linse",
    body: [
      { type: "p", text: "Most small-office networks grow one device at a time. A refresh is the moment to turn that history into a plan." },
      { type: "h2", text: "The checklist" },
      { type: "ul", items: ["Inventory every device, cable run and ISP line.", "Survey Wi-Fi coverage before choosing access points.", "Separate staff, guests and devices such as printers and cameras.", "Add a second internet line with automatic failover.", "Label everything and keep one spare switch and access point."] },
      { type: "p", text: "Done in this order, a refresh usually fits in one weekend with no downtime on Monday." },
    ],
  },
  {
    slug: "linse-2025-in-review",
    title: "2025 in review: the year we added hardware",
    category: "company",
    date: "2025-12-16",
    readTime: 3,
    excerpt: "Hardware distribution, a growing MacyePay and a support desk that never sleeps: a look back at our year.",
    author: "Linse",
    body: [
      { type: "p", text: "2025 was the year Linse stopped being only a software company. We opened a hardware line, grew MacyePay and built a support team to run what we deliver." },
      { type: "h2", text: "Highlights" },
      { type: "ul", items: ["Authorised distribution of business-grade devices and networking.", "MacyePay licensing opened to banks and large retailers.", "Managed IT plans with response times written into every contract."] },
      { type: "p", text: "Thank you to every client who trusted us with a project this year. 2026 starts with all of it under one name." },
    ],
  },
  {
    slug: "press-macyepay-licensing",
    title: "Press release: MacyePay opens licensing to banks and large retailers",
    category: "press",
    date: "2025-10-14",
    readTime: 2,
    excerpt: "Institutions can now run MacyePay’s installment and recovery engine under their own brand, as a licence or a managed service.",
    author: "Linsetech Ltd",
    body: [
      { type: "p", text: "Kigali, Rwanda. Linsetech Ltd announced today that MacyePay, its installment-payment platform, is available under licence to banks and large retailers." },
      { type: "p", text: "Licensees get the agreement, notary and automated recovery workflows, with integration to their own systems and support from the Linse team." },
      { type: "h2", text: "About Linsetech Ltd" },
      { type: "p", text: "Linse designs and builds software, publishes its own products, distributes hardware and provides IT services from Kigali." },
    ],
  },
  {
    slug: "designing-for-low-bandwidth",
    title: "Designing software for low-bandwidth connections",
    category: "insights",
    date: "2025-09-23",
    readTime: 5,
    excerpt: "Small pages, offline drafts and honest loading states: how we build for users on slow or patchy networks.",
    author: "Linse",
    body: [
      { type: "p", text: "Many of the people using our clients’ software are on mobile data, often on entry-level phones. Designing for them makes the product better for everyone." },
      { type: "h2", text: "What we do by default" },
      { type: "ul", items: ["Keep the first page under a few hundred kilobytes.", "Save form drafts on the device and send when the network returns.", "Show progress and never hide a failed request.", "Compress images and serve the right size for each screen."] },
      { type: "p", text: "We test every release on a throttled connection before it ships." },
    ],
  },
  {
    slug: "press-linse-hardware-distribution",
    title: "Press release: Linse adds hardware sales and distribution",
    category: "press",
    date: "2025-05-06",
    readTime: 2,
    excerpt: "Business-grade laptops, desktops and networking, sourced, delivered and supported by the team that builds your software.",
    author: "Linsetech Ltd",
    body: [
      { type: "p", text: "Kigali, Rwanda. Linsetech Ltd today opened a hardware sales and distribution line for business-grade devices and networking equipment." },
      { type: "p", text: "Customers can now buy the devices their software runs on from the same team, with delivery, setup and warranty handling included." },
      { type: "h2", text: "About Linsetech Ltd" },
      { type: "p", text: "Linse designs and builds software, publishes its own products, distributes hardware and provides IT services from Kigali." },
    ],
  },
  {
    slug: "backups-that-actually-restore",
    title: "Backups that actually restore",
    category: "insights",
    date: "2025-03-18",
    readTime: 4,
    excerpt: "A backup you have never restored is a hope, not a plan. The 3-2-1 rule, and the test that makes it real.",
    author: "Linse",
    body: [
      { type: "p", text: "Every client we meet has backups. Fewer have restored one. The difference shows up on the worst day of the year." },
      { type: "h2", text: "The 3-2-1 rule" },
      { type: "p", text: "Three copies of your data, on two different kinds of storage, with one copy off site. Cloud storage counts as off site if it is not syncing your mistakes in real time." },
      { type: "h2", text: "Test the restore" },
      { type: "p", text: "Once a quarter, restore a real file and a whole system to spare hardware, and time it. That number is your actual recovery time." },
    ],
  },
  {
    slug: "press-macyepay-launch",
    title: "Press release: Linse publishes MacyePay, its first product",
    category: "press",
    date: "2024-06-18",
    readTime: 2,
    excerpt: "Installment payments backed by notarised agreements and automated recovery, built and operated by Linse.",
    author: "Linsetech Ltd",
    body: [
      { type: "p", text: "Kigali, Rwanda. Linsetech Ltd today launched MacyePay, a platform that lets businesses sell on installments with legally binding agreements and automated recovery." },
      { type: "p", text: "MacyePay is the first product Linse owns and operates, alongside the software it builds for clients." },
      { type: "h2", text: "About Linsetech Ltd" },
      { type: "p", text: "Linse designs and builds software, publishes its own products, distributes hardware and provides IT services from Kigali." },
    ],
  },
  {
    slug: "press-linse-opens-in-kigali",
    title: "Press release: Linse opens as a software studio in Kigali",
    category: "press",
    date: "2022-09-12",
    readTime: 1,
    excerpt: "A new studio for websites and business systems, designed and built in Rwanda.",
    author: "Linsetech Ltd",
    body: [
      { type: "p", text: "Kigali, Rwanda. Linse opened today as a software studio building websites and business systems for local organisations." },
      { type: "p", text: "The studio works from brief to launch, and stays on to support what it builds." },
    ],
  },
];

const ABOUT_FR: Block[] = [
  { type: "h2", text: "À propos de Linsetech Ltd" },
  { type: "p", text: "Linse conçoit et développe des logiciels, publie ses propres produits, distribue du matériel et fournit des services informatiques depuis Kigali." },
];
const ABOUT_RW: Block[] = [
  { type: "h2", text: "Ibyerekeye Linsetech Ltd" },
  { type: "p", text: "Linse ikora kandi ikubaka porogaramu, igasohora ibicuruzwa byayo, igacuruza ibikoresho by’ikoranabuhanga kandi igatanga serivisi za IT iri i Kigali." },
];

const translations: Record<"fr" | "rw", Record<string, Translation>> = {
  fr: {
    "linse-launches-new-website": {
      title: "Linse lance sa nouvelle maison sur le web",
      excerpt: "Un nouveau site pour un périmètre élargi : les logiciels que nous développons, ceux que nous éditons, le matériel que nous distribuons et les services IT qui font tout tourner.",
      body: [
        { type: "p", text: "Nous lançons aujourd’hui un nouveau site qui reflète ce que Linse est devenue : une entreprise qui conçoit et développe des logiciels, édite ses propres produits, distribue du matériel et gère l’informatique des organisations qui ont besoin que tout fonctionne ensemble." },
        { type: "h2", text: "Ce qui change" },
        { type: "ul", items: ["Une rubrique Réalisations avec des études de cas, à commencer par MacyePay.", "Six services, chacun avec sa page et sa FAQ.", "Des actualités et analyses en anglais, en français et en kinyarwanda."] },
        { type: "quote", text: "Nous voulions un site qui montre notre façon de penser les produits : rapide, précis et fait pour durer." },
        { type: "p", text: "Vous avez un projet ? Utilisez « Lancer un projet » partout sur le site. Nous répondons sous deux jours ouvrés." },
      ],
    },
    "macyepay-5000-agreements": {
      title: "MacyePay dépasse les 5 000 contrats actifs",
      excerpt: "Notre plateforme de paiement échelonné sert désormais plus de 200 entreprises avec un taux de recouvrement de 98 %. Voici ce que nous avons appris.",
      body: [
        { type: "p", text: "MacyePay a franchi ce trimestre le cap des 5 000 contrats actifs, avec plus de 500 millions de RWF traités depuis le lancement." },
        { type: "h2", text: "Pourquoi le recouvrement fonctionne" },
        { type: "p", text: "Trois raisons : chaque plan est un contrat notarié et juridiquement contraignant ; les rappels et pénalités sont automatiques ; et l’historique de paiement alimente un score de confiance que les clients tiennent à préserver." },
        { type: "p", text: "Prochaines étapes : davantage de moyens de paiement et un tableau de bord pour les prêteurs." },
      ],
    },
    "choosing-laptops-for-your-team": {
      title: "Bien choisir les ordinateurs portables d’une équipe qui grandit",
      excerpt: "La garantie, la réparabilité et le coût total comptent plus que la fiche technique. Un guide pratique de notre équipe distribution.",
      body: [
        { type: "p", text: "Au-delà de dix personnes, acheter des portables n’est plus une course ponctuelle mais une politique. Voici comment nous aidons nos clients à l’écrire." },
        { type: "h2", text: "Commencer par la garantie" },
        { type: "p", text: "Un portable professionnel avec trois ans de garantie sur site coûte plus cher à l’achat et bien moins sur sa durée de vie. Demandez les conditions de garantie avant la fiche technique." },
        { type: "h2", text: "Standardiser" },
        { type: "p", text: "Deux modèles, trois configurations. Le support, les pièces détachées et le déploiement deviennent simples." },
      ],
    },
    "integrating-mobile-money": {
      title: "Intégrer le mobile money : cinq points à soigner",
      excerpt: "Les webhooks arrivent en retard, les références se télescopent et les utilisateurs rafraîchissent. Leçons tirées de nos parcours de paiement au Rwanda.",
      body: [
        { type: "p", text: "Le mobile money est le moyen de paiement par défaut de la plupart des clients de nos clients. Bien l’intégrer tient moins à l’API qu’aux cas limites." },
        { type: "ul", items: ["Considérer chaque callback comme possiblement tardif ou dupliqué.", "Interroger et rapprocher ; ne jamais se fier à une simple redirection.", "Rendre les références uniques et lisibles.", "Montrer à l’utilisateur ce qui se passe pendant l’attente.", "Tout journaliser, avec la référence de l’opérateur."] },
      ],
    },
    "press-linse-distribution-agreement": {
      title: "Communiqué : Linse signe des accords de distribution régionaux",
      excerpt: "Linsetech Ltd devient revendeur agréé d’équipements professionnels et de réseau au Rwanda.",
      body: [
        { type: "p", text: "Kigali, Rwanda. Linsetech Ltd annonce aujourd’hui la signature d’accords de distribution couvrant ordinateurs portables, serveurs et équipements réseau pour le marché rwandais." },
        { type: "p", text: "Ces accords prolongent l’activité matériel ouverte par Linse en 2025 et offrent aux clients garanties constructeur, stock local et support sur site auprès d’un seul fournisseur." },
        ...ABOUT_FR,
      ],
    },
    "what-a-managed-it-contract-should-include": {
      title: "Ce que doit contenir un contrat d’infogérance",
      excerpt: "Délais d’intervention, périmètre, reporting et plan de sortie : les clauses que nous inscrivons dans chaque contrat de support, et pourquoi.",
      body: [
        { type: "p", text: "Un contrat d’infogérance ne vaut que par ce qu’il écrit. La plupart des litiges que nous voyons naissent de ce qui était supposé, pas de ce qui était convenu." },
        { type: "h2", text: "Délais de réponse et de résolution, par priorité" },
        { type: "p", text: "Définissez ce que « critique » signifie pour votre activité, puis associez un délai de réponse et un objectif de résolution à chaque niveau. Une imprimante n’est pas un serveur." },
        { type: "h2", text: "Les clauses que nous incluons toujours" },
        { type: "ul", items: ["La liste nominative des équipements, utilisateurs et systèmes couverts.", "Des fenêtres de supervision et de mises à jour convenues à l’avance.", "Un rapport mensuel : tickets, délais et risques.", "Qui détient les mots de passe, licences et documentations.", "Un plan de sortie : comment tout vous est restitué si vous partez."] },
        { type: "p", text: "Demandez le modèle de rapport avant de signer. Il en dit long sur la façon dont le prestataire voit vos systèmes." },
      ],
    },
    "macyepay-trust-score": {
      title: "Au cœur du score de confiance MacyePay",
      excerpt: "Comment l’historique de paiement devient un score que les clients veulent protéger, et comment les commerçants s’en servent pour proposer de meilleurs plans.",
      body: [
        { type: "p", text: "Chaque client MacyePay construit un score de confiance à partir de sa façon de payer. Il le voit dans l’application, et les commerçants le voient lorsqu’un nouveau plan est proposé." },
        { type: "h2", text: "Ce qui le compose" },
        { type: "ul", items: ["Les paiements à l’heure, pondérés par leur ancienneté.", "Les contrats menés à terme.", "Les retards et la rapidité de leur régularisation.", "L’ancienneté sur la plateforme."] },
        { type: "h2", text: "Pourquoi il change les comportements" },
        { type: "p", text: "Un bon score donne accès à des plans plus longs et à des acomptes plus faibles. Les clients voient exactement ce qui le fait bouger : payer à l’heure a une récompense visible." },
        { type: "quote", text: "Le score n’est pas un système de sanction. C’est le moyen pour les bons payeurs de le prouver." },
      ],
    },
    "press-linse-one-company": {
      title: "Communiqué : logiciels, produits, matériel et services IT sous un même nom",
      excerpt: "Linsetech Ltd réunit ses quatre activités sous la marque Linse, avec une seule équipe et un seul interlocuteur.",
      body: [
        { type: "p", text: "Kigali, Rwanda. Linsetech Ltd réunit aujourd’hui son studio logiciel, l’édition de produits, la distribution de matériel et les services IT sous une seule marque : Linse." },
        { type: "p", text: "Les clients travaillent désormais avec une seule équipe pour les projets qui mêlent logiciels, équipements et support, avec un seul contrat et un seul centre d’assistance." },
        ...ABOUT_FR,
      ],
    },
    "network-refresh-checklist": {
      title: "Renouveler le réseau d’un petit bureau : la check-list",
      excerpt: "Avant de changer le routeur : cartographier l’existant, planifier le Wi-Fi, isoler les invités et garder des pièces de rechange.",
      body: [
        { type: "p", text: "La plupart des réseaux de petits bureaux grandissent un appareil à la fois. Un renouvellement est l’occasion de transformer cet historique en plan." },
        { type: "h2", text: "La check-list" },
        { type: "ul", items: ["Inventorier chaque équipement, câble et ligne internet.", "Mesurer la couverture Wi-Fi avant de choisir les bornes.", "Séparer le personnel, les invités et les appareils comme imprimantes et caméras.", "Ajouter une seconde ligne internet avec bascule automatique.", "Tout étiqueter et garder un switch et une borne de rechange."] },
        { type: "p", text: "Dans cet ordre, un renouvellement tient généralement en un week-end, sans interruption le lundi." },
      ],
    },
    "linse-2025-in-review": {
      title: "2025 en revue : l’année du matériel",
      excerpt: "La distribution de matériel, un MacyePay qui grandit et un support toujours disponible : retour sur notre année.",
      body: [
        { type: "p", text: "En 2025, Linse a cessé d’être seulement une entreprise de logiciels. Nous avons ouvert une activité matériel, fait grandir MacyePay et constitué une équipe de support pour faire tourner ce que nous livrons." },
        { type: "h2", text: "Les temps forts" },
        { type: "ul", items: ["Distribution agréée d’équipements professionnels et de réseau.", "Ouverture des licences MacyePay aux banques et grands distributeurs.", "Des offres d’infogérance avec délais d’intervention inscrits dans chaque contrat."] },
        { type: "p", text: "Merci à chaque client qui nous a confié un projet cette année. 2026 commence avec tout cela sous un même nom." },
      ],
    },
    "press-macyepay-licensing": {
      title: "Communiqué : MacyePay ouvre ses licences aux banques et grands distributeurs",
      excerpt: "Les institutions peuvent exploiter le moteur de paiement échelonné et de recouvrement de MacyePay sous leur propre marque, en licence ou en service géré.",
      body: [
        { type: "p", text: "Kigali, Rwanda. Linsetech Ltd annonce aujourd’hui que MacyePay, sa plateforme de paiement échelonné, est disponible sous licence pour les banques et les grands distributeurs." },
        { type: "p", text: "Les licenciés bénéficient des parcours contrat, notaire et recouvrement automatisé, intégrés à leurs propres systèmes et accompagnés par l’équipe Linse." },
        ...ABOUT_FR,
      ],
    },
    "designing-for-low-bandwidth": {
      title: "Concevoir des logiciels pour les connexions à faible débit",
      excerpt: "Des pages légères, des brouillons hors ligne et des chargements honnêtes : comment nous concevons pour les réseaux lents ou instables.",
      body: [
        { type: "p", text: "Beaucoup d’utilisateurs des logiciels de nos clients sont sur données mobiles, souvent avec des téléphones d’entrée de gamme. Concevoir pour eux améliore le produit pour tous." },
        { type: "h2", text: "Ce que nous faisons par défaut" },
        { type: "ul", items: ["Garder la première page sous quelques centaines de kilo-octets.", "Enregistrer les brouillons sur l’appareil et les envoyer au retour du réseau.", "Afficher la progression et ne jamais masquer une requête échouée.", "Compresser les images et servir la bonne taille pour chaque écran."] },
        { type: "p", text: "Chaque version est testée sur une connexion bridée avant sa mise en ligne." },
      ],
    },
    "press-linse-hardware-distribution": {
      title: "Communiqué : Linse se lance dans la vente et la distribution de matériel",
      excerpt: "Ordinateurs, postes fixes et réseau professionnels, achetés, livrés et suivis par l’équipe qui développe vos logiciels.",
      body: [
        { type: "p", text: "Kigali, Rwanda. Linsetech Ltd ouvre aujourd’hui une activité de vente et de distribution d’équipements informatiques et réseau professionnels." },
        { type: "p", text: "Les clients peuvent désormais acheter les appareils sur lesquels tournent leurs logiciels auprès de la même équipe, livraison, installation et gestion de la garantie comprises." },
        ...ABOUT_FR,
      ],
    },
    "backups-that-actually-restore": {
      title: "Des sauvegardes qui se restaurent vraiment",
      excerpt: "Une sauvegarde jamais restaurée est un espoir, pas un plan. La règle 3-2-1, et le test qui la rend réelle.",
      body: [
        { type: "p", text: "Tous les clients que nous rencontrons ont des sauvegardes. Peu en ont déjà restauré une. La différence se voit le pire jour de l’année." },
        { type: "h2", text: "La règle 3-2-1" },
        { type: "p", text: "Trois copies de vos données, sur deux types de support, dont une hors site. Le cloud compte comme hors site s’il ne synchronise pas vos erreurs en temps réel." },
        { type: "h2", text: "Tester la restauration" },
        { type: "p", text: "Chaque trimestre, restaurez un vrai fichier et un système complet sur du matériel de secours, chronomètre en main. Ce temps est votre vrai délai de reprise." },
      ],
    },
    "press-macyepay-launch": {
      title: "Communiqué : Linse publie MacyePay, son premier produit",
      excerpt: "Le paiement échelonné adossé à des contrats notariés et à un recouvrement automatisé, développé et exploité par Linse.",
      body: [
        { type: "p", text: "Kigali, Rwanda. Linsetech Ltd lance aujourd’hui MacyePay, une plateforme qui permet aux entreprises de vendre en plusieurs fois grâce à des contrats juridiquement contraignants et à un recouvrement automatisé." },
        { type: "p", text: "MacyePay est le premier produit détenu et exploité par Linse, aux côtés des logiciels qu’elle développe pour ses clients." },
        ...ABOUT_FR,
      ],
    },
    "press-linse-opens-in-kigali": {
      title: "Communiqué : Linse ouvre un studio logiciel à Kigali",
      excerpt: "Un nouveau studio de sites web et de systèmes de gestion, conçus et développés au Rwanda.",
      body: [
        { type: "p", text: "Kigali, Rwanda. Linse ouvre aujourd’hui ses portes : un studio logiciel qui crée des sites web et des systèmes de gestion pour les organisations locales." },
        { type: "p", text: "Le studio accompagne chaque projet du brief au lancement, puis assure le suivi de ce qu’il construit." },
      ],
    },
  },
  rw: {
    "linse-launches-new-website": {
      title: "Linse yatangije urubuga rwayo rushya",
      excerpt: "Urubuga rushya rugaragaza ibyo dukora byose: porogaramu twubaka, porogaramu dutunze, ibikoresho ducuruza na serivisi za IT zituma byose bikora.",
      body: [
        { type: "p", text: "Uyu munsi dutangije urubuga rushya rugaragaza icyo Linse yabaye: ikigo gitegura kandi kikubaka porogaramu, gisohora ibicuruzwa byacyo, gicuruza ibikoresho kandi kigacunga IT y’ibigo bikeneye ko ibyo byose bikorera hamwe." },
        { type: "h2", text: "Ibishya" },
        { type: "ul", items: ["Igice cy’Imirimo kirimo inyigo, duhereye kuri MacyePay.", "Serivisi esheshatu, buri imwe ifite urupapuro rwayo n’ibibazo bikunze kubazwa.", "Amakuru n’ubusesenguzi mu Cyongereza, Igifaransa n’Ikinyarwanda."] },
        { type: "quote", text: "Twashakaga urubuga rugaragaza uko dutekereza ibicuruzwa: byihuta, binoze kandi byubakiwe gukora." },
        { type: "p", text: "Niba ufite umushinga, kanda “Tangira umushinga” aho ari ho hose ku rubuga. Dusubiza mu minsi ibiri y’akazi." },
      ],
    },
    "macyepay-5000-agreements": {
      title: "MacyePay yarenze amasezerano 5.000 akora",
      excerpt: "Urubuga rwacu rwo kwishyura mu byiciro rukorana n’ibigo birenga 200, rufite igipimo cyo kugaruza cya 98%. Dore ibyo twize.",
      body: [
        { type: "p", text: "Muri iki gihembwe MacyePay yarenze amasezerano 5.000 akora, kandi kuva yatangira imaze kunyuzwamo arenga miliyoni 500 RWF." },
        { type: "h2", text: "Impamvu kugaruza bikora" },
        { type: "p", text: "Impamvu eshatu: buri gahunda ni amasezerano yemejwe na noteri kandi afite agaciro mu mategeko; kwibutsa n’ibihano bikorwa mu buryo bwikora; kandi amateka yo kwishyura atanga amanota y’icyizere abakiriya bifuza kurinda." },
        { type: "p", text: "Ibikurikira: uburyo bwinshi bwo kwishyura n’ikibaho cy’abatanga inguzanyo." },
      ],
    },
    "choosing-laptops-for-your-team": {
      title: "Uko wahitamo mudasobwa zigendanwa z’itsinda rikura",
      excerpt: "Garanti, uburyo bwo gusana n’igiciro cyose bifite akamaro kuruta ibisobanuro bya tekiniki. Inama z’itsinda ryacu ricuruza ibikoresho.",
      body: [
        { type: "p", text: "Iyo itsinda rirenze abantu icumi, kugura mudasobwa ntibiba ari ukujya guhaha gusa, biba politiki. Dore uko dufasha abakiriya bacu kuyandika." },
        { type: "h2", text: "Hera kuri garanti" },
        { type: "p", text: "Mudasobwa y’akazi ifite garanti y’imyaka itatu ikorerwa aho uri ihenda mbere, ariko igahenduka cyane mu gihe cyose izamara. Baza amabwiriza ya garanti mbere y’ibisobanuro bya tekiniki." },
        { type: "h2", text: "Gira ibipimo bimwe" },
        { type: "p", text: "Ubwoko bubiri, imiterere itatu. Bituma ubufasha, ibice by’ibisimbura n’itegurwa ryazo byoroha." },
      ],
    },
    "integrating-mobile-money": {
      title: "Guhuza mobile money: ibintu bitanu ugomba kunoza",
      excerpt: "Webhooks zitinda, indangamuntu z’ubwishyu zigongana kandi abakoresha basubiramo urupapuro. Amasomo twakuye mu kubaka uburyo bwo kwishyura mu Rwanda.",
      body: [
        { type: "p", text: "Mobile money ni bwo buryo bwo kwishyura abakiriya benshi b’abakiriya bacu bakoresha. Kuyihuza neza ntibishingiye cyane kuri API, ahubwo bishingiye ku bihe bidasanzwe." },
        { type: "ul", items: ["Fata buri callback nk’ishobora gutinda cyangwa kugaruka kabiri.", "Baza kandi uhuze imibare; ntukizere gusa kohereza ku rundi rupapuro.", "Kora indangamuntu z’ubwishyu zidasubirwamo kandi zisomeka.", "Erekana umukoresha ibiri kuba igihe ategereje.", "Bika byose, hamwe n’indangamuntu y’utanga serivisi."] },
      ],
    },
    "press-linse-distribution-agreement": {
      title: "Itangazo: Linse yasinye amasezerano yo gucuruza mu karere",
      excerpt: "Linsetech Ltd ibaye umucuruzi wemewe w’ibikoresho by’akazi n’iby’imiyoboro mu Rwanda.",
      body: [
        { type: "p", text: "Kigali, Rwanda. Linsetech Ltd yatangaje uyu munsi ko yasinye amasezerano yo gucuruza mudasobwa, seriveri n’ibikoresho by’imiyoboro ku isoko ry’u Rwanda." },
        { type: "p", text: "Aya masezerano yagura igice cy’ibikoresho Linse yafunguye mu 2025, akaha abakiriya garanti z’abakora ibikoresho, ububiko bwo mu gihugu n’ubufasha bubasanga aho bari biturutse ku mucuruzi umwe." },
        ...ABOUT_RW,
      ],
    },
    "what-a-managed-it-contract-should-include": {
      title: "Ibyo amasezerano yo gucunga IT agomba gukubiyemo",
      excerpt: "Igihe cyo gusubiza, ibikubiyemo, raporo n’uburyo bwo gusoza: ingingo dushyira muri buri masezerano y’ubufasha, n’impamvu.",
      body: [
        { type: "p", text: "Amasezerano yo gucunga IT agira agaciro bitewe n’ibyanditswemo. Amakimbirane menshi tubona aturuka ku byakekwaga, si ku byumvikanyweho." },
        { type: "h2", text: "Igihe cyo gusubiza no gukemura, hakurikijwe uburemere" },
        { type: "p", text: "Sobanura icyo “byihutirwa” bivuze ku kigo cyawe, hanyuma ushyireho igihe cyo gusubiza n’intego yo gukemura kuri buri rwego. Imashini isohora impapuro si seriveri." },
        { type: "h2", text: "Ingingo duhora dushyiramo" },
        { type: "ul", items: ["Urutonde rw’ibikoresho, abakoresha na sisitemu birebwa.", "Igihe cyo kugenzura no kuvugurura cyumvikanyweho mbere.", "Raporo ya buri kwezi: ibibazo, igihe cyo gusubiza n’ingaruka zishoboka.", "Ufite ijambo ry’ibanga, impushya n’inyandiko.", "Uburyo bwo gusoza: uko byose bigusubizwa niba ugiye."] },
        { type: "p", text: "Saba urugero rwa raporo mbere yo gusinya. Rukwereka uko utanga serivisi abona sisitemu zawe." },
      ],
    },
    "macyepay-trust-score": {
      title: "Amanota y’icyizere ya MacyePay",
      excerpt: "Uko amateka yo kwishyura ahinduka amanota abakiriya bifuza kurinda, n’uko abacuruzi bayakoresha batanga gahunda nziza.",
      body: [
        { type: "p", text: "Buri mukiriya wa MacyePay yubaka amanota y’icyizere bitewe n’uko yishyura. Ayabona muri porogaramu, kandi abacuruzi barayabona iyo gahunda nshya itanzwe." },
        { type: "h2", text: "Ibiyagize" },
        { type: "ul", items: ["Kwishyura ku gihe, hagendewe ku bya vuba.", "Amasezerano yarangiye.", "Gutinda kwishyura n’uko byakemuwe vuba.", "Igihe umaze ku rubuga."] },
        { type: "h2", text: "Impamvu ahindura imyitwarire" },
        { type: "p", text: "Amanota meza atuma ubona gahunda ndende n’ingwate nke. Abakiriya babona neza ibiyahindura, bityo kwishyura ku gihe bikagira igihembo kigaragara." },
        { type: "quote", text: "Amanota si uburyo bwo guhana. Ni uburyo abishyura neza babigaragaza." },
      ],
    },
    "press-linse-one-company": {
      title: "Itangazo: Porogaramu, ibicuruzwa, ibikoresho na serivisi za IT munsi y’izina rimwe",
      excerpt: "Linsetech Ltd ihurije ibikorwa byayo bine munsi y’ikirango Linse, n’itsinda rimwe n’umuhuza umwe.",
      body: [
        { type: "p", text: "Kigali, Rwanda. Uyu munsi Linsetech Ltd yahurije hamwe sitidiyo yayo ya porogaramu, isohora ry’ibicuruzwa, icuruzwa ry’ibikoresho na serivisi za IT munsi y’ikirango kimwe: Linse." },
        { type: "p", text: "Abakiriya ubu bakorana n’itsinda rimwe ku mishinga ihuza porogaramu, ibikoresho n’ubufasha, bafite amasezerano amwe n’ahantu hamwe ho gusaba ubufasha." },
        ...ABOUT_RW,
      ],
    },
    "network-refresh-checklist": {
      title: "Urutonde rwo kuvugurura umuyoboro w’ibiro bito",
      excerpt: "Mbere yo guhindura router: menya ibyo ufite, tegura Wi-Fi, tandukanya abashyitsi kandi ubike ibisimbura.",
      body: [
        { type: "p", text: "Imiyoboro myinshi y’ibiro bito ikura igikoresho kimwe kimwe. Kuyivugurura ni umwanya wo guhindura ayo mateka gahunda." },
        { type: "h2", text: "Urutonde" },
        { type: "ul", items: ["Andika buri gikoresho, buri murongo w’insinga na buri murongo wa interineti.", "Pima aho Wi-Fi igera mbere yo guhitamo access points.", "Tandukanya abakozi, abashyitsi n’ibikoresho nk’imashini zisohora impapuro na kamera.", "Ongeraho umurongo wa kabiri wa interineti uhita usimbura uwa mbere.", "Shyira ibirango kuri byose kandi ubike switch imwe na access point imwe zisimbura."] },
        { type: "p", text: "Ukurikije uru rutonde, ivugurura rikunze kurangira mu mpera z’icyumweru imwe, nta guhagarara ku wa mbere." },
      ],
    },
    "linse-2025-in-review": {
      title: "Isubiramo rya 2025: umwaka twongeyeho ibikoresho",
      excerpt: "Gucuruza ibikoresho, MacyePay ikura n’ubufasha buhora buhari: dusubiye inyuma ku mwaka wacu.",
      body: [
        { type: "p", text: "Mu 2025 Linse yaretse kuba ikigo cya porogaramu gusa. Twafunguye igice cy’ibikoresho, twagura MacyePay kandi twubaka itsinda ry’ubufasha ricunga ibyo dutanga." },
        { type: "h2", text: "Iby’ingenzi" },
        { type: "ul", items: ["Gucuruza byemewe ibikoresho by’akazi n’iby’imiyoboro.", "Impushya za MacyePay zafunguriwe amabanki n’abacuruzi banini.", "Gahunda zo gucunga IT zifite igihe cyo gusubiza cyanditswe muri buri masezerano."] },
        { type: "p", text: "Turashimira buri mukiriya watwizeye umushinga uyu mwaka. 2026 itangiye byose biri munsi y’izina rimwe." },
      ],
    },
    "press-macyepay-licensing": {
      title: "Itangazo: MacyePay yafunguriye impushya amabanki n’abacuruzi banini",
      excerpt: "Ibigo ubu bishobora gukoresha moteri ya MacyePay yo kwishyura mu byiciro no kugaruza munsi y’ikirango cyabyo, nk’uruhushya cyangwa serivisi icungwa.",
      body: [
        { type: "p", text: "Kigali, Rwanda. Linsetech Ltd yatangaje uyu munsi ko MacyePay, urubuga rwayo rwo kwishyura mu byiciro, iboneka ku ruhushya ku mabanki n’abacuruzi banini." },
        { type: "p", text: "Abahawe uruhushya babona uburyo bw’amasezerano, bwa noteri n’ubwo kugaruza bwikora, buhujwe na sisitemu zabo kandi bafashwa n’itsinda rya Linse." },
        ...ABOUT_RW,
      ],
    },
    "designing-for-low-bandwidth": {
      title: "Gutegura porogaramu zikorera kuri interineti itihuta",
      excerpt: "Impapuro zoroshye, inyandiko zibikwa nta interineti n’uburyo bwo gutegereza bwerekana ukuri: uko twubakira abari ku miyoboro itinda.",
      body: [
        { type: "p", text: "Abantu benshi bakoresha porogaramu z’abakiriya bacu bari kuri interineti ya telefoni, akenshi kuri telefoni zoroheje. Kubategurira bituma igicuruzwa kiba cyiza kuri bose." },
        { type: "h2", text: "Ibyo dukora buri gihe" },
        { type: "ul", items: ["Urupapuro rwa mbere ruguma munsi ya kilobayiti magana make.", "Inyandiko z’amafishi zibikwa kuri telefoni zikoherezwa interineti igarutse.", "Kwerekana aho bigeze kandi ntituhishe ubusabe bwanze.", "Kugabanya ingano y’amafoto no gutanga ingano ikwiriye buri rugaragaza."] },
        { type: "p", text: "Buri verisiyo tuyigerageza kuri interineti igabanyijwe mbere yo kuyishyira ahagaragara." },
      ],
    },
    "press-linse-hardware-distribution": {
      title: "Itangazo: Linse yongeyeho kugurisha no gucuruza ibikoresho",
      excerpt: "Mudasobwa n’ibikoresho by’imiyoboro by’akazi, bigurwa, bigezwa kandi bikitabwaho n’itsinda ryubaka porogaramu zawe.",
      body: [
        { type: "p", text: "Kigali, Rwanda. Uyu munsi Linsetech Ltd yafunguye igice cyo kugurisha no gucuruza ibikoresho by’ikoranabuhanga n’iby’imiyoboro by’akazi." },
        { type: "p", text: "Abakiriya ubu bashobora kugura ibikoresho porogaramu zabo zikoreraho ku itsinda rimwe, harimo kubigeza, kubishyiraho no gukurikirana garanti." },
        ...ABOUT_RW,
      ],
    },
    "backups-that-actually-restore": {
      title: "Kubika kopi zishobora kugarurwa koko",
      excerpt: "Kopi utarigeze ugarura ni icyizere, si gahunda. Itegeko rya 3-2-1, n’igerageza ribigira impamo.",
      body: [
        { type: "p", text: "Abakiriya bose duhura na bo bafite kopi z’amakuru. Bake ni bo bigeze kugarura imwe. Itandukaniro rigaragara ku munsi mubi kurusha iyindi y’umwaka." },
        { type: "h2", text: "Itegeko rya 3-2-1" },
        { type: "p", text: "Kopi eshatu z’amakuru yawe, ku bwoko bubiri bw’ububiko, imwe ikabikwa ahandi. Cloud ibarwa nk’ahandi niba itahita yigana amakosa yawe ako kanya." },
        { type: "h2", text: "Gerageza kugarura" },
        { type: "p", text: "Buri gihembwe, garura dosiye nyayo na sisitemu yose ku bikoresho by’ingoboka, ubare igihe bifata. Icyo gihe ni cyo gihe nyacyo cyo kongera gukora." },
      ],
    },
    "press-macyepay-launch": {
      title: "Itangazo: Linse yasohoye MacyePay, igicuruzwa cyayo cya mbere",
      excerpt: "Kwishyura mu byiciro bishingiye ku masezerano yemejwe na noteri no kugaruza bwikora, byubatswe kandi bicungwa na Linse.",
      body: [
        { type: "p", text: "Kigali, Rwanda. Uyu munsi Linsetech Ltd yatangije MacyePay, urubuga rufasha ibigo kugurisha mu byiciro hakoreshejwe amasezerano afite agaciro mu mategeko no kugaruza bwikora." },
        { type: "p", text: "MacyePay ni igicuruzwa cya mbere Linse itunze kandi icunga, hamwe na porogaramu yubakira abakiriya." },
        ...ABOUT_RW,
      ],
    },
    "press-linse-opens-in-kigali": {
      title: "Itangazo: Linse yafunguye sitidiyo ya porogaramu i Kigali",
      excerpt: "Sitidiyo nshya y’imbuga za interineti na sisitemu z’ibigo, zitegurwa kandi zubakirwa mu Rwanda.",
      body: [
        { type: "p", text: "Kigali, Rwanda. Uyu munsi Linse yafunguye imiryango nka sitidiyo ya porogaramu yubaka imbuga za interineti na sisitemu z’ibigo byo mu gihugu." },
        { type: "p", text: "Sitidiyo ikurikirana buri mushinga kuva ku gitekerezo kugeza ku itangizwa, kandi ikomeza kwita ku byo yubatse." },
      ],
    },
  },
};

const byDateDesc = (a: Post, b: Post) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0);

/** The post in the visitor's language (falls back to English when a translation is missing). */
export function localizePost(p: Post, locale: string): Post {
  const t = locale === "fr" || locale === "rw" ? translations[locale][p.slug] : undefined;
  return t ? { ...p, ...t } : p;
}

/** All local posts, newest first, in `locale`. */
export const postsFor = (locale: string) => posts.map((p) => localizePost(p, locale)).sort(byDateDesc);

export const postFor = (locale: string, slug: string) => {
  const p = posts.find((x) => x.slug === slug);
  return p ? localizePost(p, locale) : undefined;
};

export const getPost = (slug: string) => posts.find((p) => p.slug === slug);
export const sortedPosts = () => [...posts].sort(byDateDesc);
