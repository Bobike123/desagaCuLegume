import { describe, expect, it } from 'vitest';
import { STORE_INFO } from './site';
import {
  VEGETABLE_CATEGORIES,
  VEGETABLE_STORE_DESCRIPTION,
  VEGETABLE_STORE_PAGE_URL,
  VEGETABLE_STORE_TITLE,
  getVegetableStoreSchema,
} from './vegetable-store';

describe('vegetable store SEO metadata', () => {
  it('uses accurate visible metadata for the Cluj-Napoca vegetable page', () => {
    expect(VEGETABLE_STORE_TITLE).toBe(`Legume proaspete în Cluj-Napoca | ${STORE_INFO.name}`);
    expect(VEGETABLE_STORE_DESCRIPTION).toContain('Comandă legume proaspete în Cluj-Napoca');
    expect(VEGETABLE_STORE_PAGE_URL).toContain('/legume-proaspete-cluj-napoca');
  });

  it('builds valid GroceryStore JSON-LD without decoy language', () => {
    const schema = getVegetableStoreSchema();
    const serialized = JSON.stringify(schema);

    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('GroceryStore');
    expect(schema.name).toBe(STORE_INFO.name);
    expect(schema.address.addressLocality).toBe('Cluj-Napoca');
    expect(schema.areaServed[0].name).toBe('Cluj-Napoca');
    expect(schema.makesOffer).toHaveLength(VEGETABLE_CATEGORIES.length);
    expect(serialized).not.toMatch(/decoy|leak|credential/i);
  });
});
