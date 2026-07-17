const SITE_URL = 'https://desagaculegume.ro';

export const STORE_INFO = {
  name: 'DeSaga cu Legume',
  phone: '+40 729 969 822',
  phoneHref: 'tel:+40729969822',
  address: {
    streetAddress: 'Strada Constantin Brâncuși 153',
    addressLocality: 'Cluj-Napoca',
    postalCode: '400458',
    addressCountry: 'RO',
  },
  openingHours: ['Mo-Fr 09:00-18:00'],
  facebook: 'https://www.facebook.com/desagaculegume/',
  instagram: 'https://www.instagram.com/desaga_cu_legume/',
};

export const PUBLIC_SITEMAP_PATHS = [
  '/',
  '/produse',
  '/produse/legume',
  '/produse/fructe',
  '/produse/la-borcan',
  '/horeca',
  '/despre-noi',
  '/contact',
  '/livrare-ridicare',
  '/legume-proaspete-cluj-napoca',
] as const;

export function absoluteUrl(path = '/') {
  const base = SITE_URL.replace(/\/+$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
