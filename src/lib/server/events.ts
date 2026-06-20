export const EVENT_TYPES = ['FESTIVAL', 'PIATA', 'ATELIER'] as const;
export type EventType = (typeof EVENT_TYPES)[number];
