// Single source of truth for the product taxonomy.
//
// The catalog was split from two categories (de-sezon / la-borcan) into three:
// Fructe, Legume and La borcan. Everything the UI needs to render a category
// (labels, pill colour, icon, page copy) lives here so the names/colours can be
// changed in one place. The DB side is handled by the matching migration in
// supabase/migrations. Keep the slugs in sync with that migration's CHECK
// constraint. See [[server/catalog]] for the server-side helpers.

export const PRODUCT_CATEGORY_SLUGS = ['legume', 'fructe', 'la-borcan'] as const;
export type ProductCategorySlug = (typeof PRODUCT_CATEGORY_SLUGS)[number];

// Products migrated from the old "de-sezon" bucket (and any without a category)
// default to Legume.
export const DEFAULT_CATEGORY_SLUG: ProductCategorySlug = 'legume';

export type CategoryInfoCard = { title: string; text: string };

export type ProductCategoryMeta = {
  slug: ProductCategorySlug;
  /** Short label shown on the card pill, admin select and nav. */
  name: string;
  /** Pill colour class defined in ProductCard.svelte (tone-green/orange/amber). */
  tone: string;
  /** Bootstrap icon class used in nav, detail page and category pages. */
  icon: string;
  /** One-line helper shown under the admin category select. */
  hint: string;
  /** Longer description, also used as the DB category description. */
  description: string;
  /** Short kicker used above the slider title on the home page. */
  homeKicker: string;
  /** Content for the dedicated /produse/<slug> listing page. */
  page: {
    hero: string;
    kicker: string;
    title: string;
    subtitle: string;
    introEyebrow: string;
    introTitle: string;
    introLead: string;
    infoCards: CategoryInfoCard[];
  };
};

export const PRODUCT_CATEGORIES: ProductCategoryMeta[] = [
  {
    slug: 'legume',
    name: 'Legume',
    tone: 'tone-green',
    icon: '',
    hint: 'Legume proaspete, de sezon',
    description: 'Legume proaspete, de sezon, de la producători locali.',
    homeKicker: 'Din grădină',
    page: {
      hero: '/images/produse/de-sezon-hero.jpg',
      kicker: 'De sezon',
      title: 'Legume de sezon',
      subtitle: 'Legume proaspete, culese la vremea lor, disponibile în funcție de recoltă.',
      introEyebrow: 'Din fermă la rulotă',
      introTitle: 'Legume proaspete, sezon real',
      introLead:
        'Aici apar legumele proaspete disponibile acum. Oferta se schimbă natural, în funcție de recoltă și stoc.',
      infoCards: [
        { title: 'Primăvară', text: 'Salată, ridichi, ceapă verde, spanac, verdețuri, cartofi noi.' },
        { title: 'Vară', text: 'Roșii, castraveți, ardei, vinete, dovlecei, fasole verde.' },
        { title: 'Toamnă', text: 'Gogoșari, varză, conopidă, morcovi, dovleac, sfeclă.' },
        { title: 'Iarnă', text: 'Rădăcinoase, cartofi, ceapă, usturoi și varză de iarnă.' },
      ],
    },
  },
  {
    slug: 'fructe',
    name: 'Fructe',
    tone: 'tone-orange',
    icon: '',
    hint: 'Fructe proaspete, de sezon',
    description: 'Fructe proaspete, de sezon, de la producători locali.',
    homeKicker: 'Din livadă',
    page: {
      hero: '/images/produse/de-sezon-hero.jpg',
      kicker: 'De sezon',
      title: 'Fructe de sezon',
      subtitle: 'Fructe dulci, culese copt, disponibile în funcție de recoltă.',
      introEyebrow: 'Din livadă la rulotă',
      introTitle: 'Fructe de sezon, culese copt',
      introLead:
        'Aici apar fructele proaspete disponibile acum. Oferta se schimbă natural, în funcție de recoltă și stoc.',
      infoCards: [
        { title: 'Primăvară', text: 'Căpșuni, cireșe timpurii, rubarbă și primele fructe de grădină.' },
        { title: 'Vară', text: 'Caise, piersici, pepene, prune, zmeură și fructe de pădure.' },
        { title: 'Toamnă', text: 'Mere, pere, struguri, gutui, nuci și prune de toamnă.' },
        { title: 'Iarnă', text: 'Mere și pere păstrate, nuci și fructe uscate de sezon.' },
      ],
    },
  },
  {
    slug: 'la-borcan',
    name: 'La borcan',
    tone: 'tone-amber',
    icon: '',
    hint: 'Conserve, murături, sosuri',
    description: 'Bunătăți conservate și produse pregătite la borcan.',
    homeKicker: 'Din cămară',
    page: {
      hero: '/images/produse/la-borcan-hero.jpg',
      kicker: 'Cămara DeSaga',
      title: 'Produse la borcan',
      subtitle: 'Borcane pregătite cu grijă, pentru gust de casă tot anul.',
      introEyebrow: 'Cămara DeSaga',
      introTitle: 'Conserve, sosuri și bunătăți păstrate cu grijă',
      introLead:
        'Tot ce este afișat mai jos vine din categoria la borcan și este disponibil acum pentru comandă sau ridicare.',
      infoCards: [
        { title: 'Murături', text: 'Borcane pregătite pentru mese simple, rapide și gustoase.' },
        { title: 'Zacuscă și sosuri', text: 'Rețete lente, gust de casă, fără promisiuni inutile.' },
        { title: 'Dulcețuri', text: 'Fructe păstrate pentru zilele în care vrei ceva bun.' },
      ],
    },
  },
];

const CATEGORY_BY_SLUG = new Map<string, ProductCategoryMeta>(
  PRODUCT_CATEGORIES.map((category) => [category.slug, category]),
);

export function isProductCategorySlug(value: unknown): value is ProductCategorySlug {
  return typeof value === 'string' && CATEGORY_BY_SLUG.has(value);
}

/** Resolve any slug to its metadata, falling back to the default category. */
export function categoryMeta(slug: string | null | undefined): ProductCategoryMeta {
  return CATEGORY_BY_SLUG.get(String(slug ?? '')) ?? CATEGORY_BY_SLUG.get(DEFAULT_CATEGORY_SLUG)!;
}
