export const SUPPORT_TOPICS = [
  'ORDER',
  'DELIVERY',
  'PAYMENT',
  'PRODUCT_AVAILABILITY',
  'RETURN',
  'HORECA',
  'GENERAL',
] as const;

export type SupportTopic = (typeof SUPPORT_TOPICS)[number];

export type SupportTopicMeta = {
  label: string;
  shortLabel: string;
  icon: string;
};

export const SUPPORT_TOPIC_META: Record<SupportTopic, SupportTopicMeta> = {
  ORDER: {
    label: 'Comandă',
    shortLabel: 'Comenzi',
    icon: 'bi-receipt',
  },
  DELIVERY: {
    label: 'Livrare / ridicare',
    shortLabel: 'Livrare',
    icon: 'bi-truck',
  },
  PAYMENT: {
    label: 'Plată',
    shortLabel: 'Plată',
    icon: 'bi-credit-card',
  },
  PRODUCT_AVAILABILITY: {
    label: 'Disponibilitate produs',
    shortLabel: 'Produse',
    icon: 'bi-basket',
  },
  RETURN: {
    label: 'Retur / reclamație',
    shortLabel: 'Retur',
    icon: 'bi-arrow-counterclockwise',
  },
  HORECA: {
    label: 'HORECA',
    shortLabel: 'HORECA',
    icon: 'bi-shop',
  },
  GENERAL: {
    label: 'Întrebare generală',
    shortLabel: 'General',
    icon: 'bi-chat-dots',
  },
};

export function normalizeSupportTopic(value: unknown): SupportTopic {
  const normalized = String(value ?? '').trim().toUpperCase();
  return SUPPORT_TOPICS.includes(normalized as SupportTopic) ? (normalized as SupportTopic) : 'GENERAL';
}
