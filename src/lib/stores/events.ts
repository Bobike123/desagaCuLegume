// src/lib/stores/events.ts
import { writable } from 'svelte/store';

export interface EventItem {
    id: string;
    title: string;
    description: string;
    date: string;            // ISO string
    location: string;
    image_url: string | null;
    event_type: string;
    published: boolean;
    created_at?: string;
    updated_at?: string;
    published_at?: string | null;
}

export type Event = EventItem;

type EventsState = {
    items: EventItem[];
    loading: boolean;
    error: string | null;
};

const state = writable<EventsState>({ items: [], loading: false, error: null });

export const eventsStore = {
    subscribe: state.subscribe,

    async loadAll(admin = false) {
        state.update((s) => ({ ...s, loading: true, error: null }));
        try {
            const qs = admin ? '?admin=true' : '';
            const res = await fetch(`/api/evenimente${qs}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error ?? 'Failed to load events');

            state.set({ items: data ?? [], loading: false, error: null });
            return data as EventItem[];
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Unknown error';
            state.set({ items: [], loading: false, error: msg });
            return [];
        }
    },

    async getById(id: string) {
        const res = await fetch(`/api/evenimente/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? 'Failed to load event');
        return data as EventItem;
    }
};

// Legacy reads
export async function getAllEvents() {
    return eventsStore.loadAll(false);
}
export async function getEventById(id: string) {
    return eventsStore.getById(id);
}

// Admin writes (what your admin page imports)
export async function updateEvent(id: string, patch: Partial<EventItem>) {
    const res = await fetch(`/api/evenimente/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error ?? 'Failed to update event');
    return data as EventItem;
}

export async function deleteEvent(id: string) {
    const res = await fetch(`/api/evenimente/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error ?? 'Failed to delete event');
    return data as { success: true };
}
