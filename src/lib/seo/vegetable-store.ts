import { absoluteUrl, STORE_INFO } from '$lib/seo/site';

const VEGETABLE_STORE_PATH = '/legume-proaspete-cluj-napoca';
export const VEGETABLE_STORE_PAGE_URL = absoluteUrl(VEGETABLE_STORE_PATH);
export const VEGETABLE_STORE_TITLE = `Legume proaspete în Cluj-Napoca | ${STORE_INFO.name}`;
export const VEGETABLE_STORE_DESCRIPTION =
  'Comandă legume proaspete în Cluj-Napoca. Produse de sezon, opțiuni locale, ridicare sau livrare confirmată.';

export const VEGETABLE_CATEGORIES = [
  'roșii',
  'castraveți',
  'cartofi',
  'ceapă',
  'morcovi',
  'ardei',
  'varză',
  'legume de sezon',
];

export const CLUJ_NEIGHBORHOODS = [
  'Gheorgheni',
  'Mărăști',
  'Mănăștur',
  'Zorilor',
  'Bună Ziua',
  'Între Lacuri',
  'Grigorescu',
];

export const VEGETABLE_STORE_FAQ = [
  {
    question: 'Livrați legume în Cluj-Napoca?',
    answer:
      'Livrarea poate fi solicitată în Cluj-Napoca și este confirmată în funcție de program, traseu și disponibilitatea din ziua respectivă.',
  },
  {
    question: 'Ce legume sunt disponibile astăzi?',
    answer:
      'Catalogul afișează produsele disponibile, iar stocul final este confirmat când pregătim comanda.',
  },
  {
    question: 'Legumele sunt locale?',
    answer:
      'DeSaga cu Legume prioritizează produsele locale și de sezon atunci când sunt disponibile, cu accent pe legume proaspete pentru clienții din Cluj.',
  },
  {
    question: 'Pot comanda online?',
    answer:
      'Da. Poți vedea produsele online, le poți adăuga în coș și poți trimite comanda pentru confirmare.',
  },
  {
    question: 'Ce zone din Cluj-Napoca acoperiți?',
    answer:
      'Servim Cluj-Napoca, inclusiv cartiere precum Gheorgheni, Mărăști, Mănăștur, Zorilor, Bună Ziua, Între Lacuri și Grigorescu atunci când livrarea este disponibilă.',
  },
];

export function getVegetableStoreSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'GroceryStore',
    name: STORE_INFO.name,
    description: VEGETABLE_STORE_DESCRIPTION,
    url: VEGETABLE_STORE_PAGE_URL,
    telephone: STORE_INFO.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: STORE_INFO.address.streetAddress,
      addressLocality: STORE_INFO.address.addressLocality,
      postalCode: STORE_INFO.address.postalCode,
      addressCountry: STORE_INFO.address.addressCountry,
    },
    areaServed: [
      {
        '@type': 'City',
        name: 'Cluj-Napoca',
      },
    ],
    openingHours: STORE_INFO.openingHours,
    sameAs: [STORE_INFO.facebook, STORE_INFO.instagram],
    makesOffer: VEGETABLE_CATEGORIES.map((category) => ({
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Product',
        name: category,
      },
      areaServed: 'Cluj-Napoca',
    })),
  };
}
