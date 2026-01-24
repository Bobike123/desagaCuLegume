// FILE: src/lib/stores/events.ts

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

const store = writable<EventsState>({
    items: [],
    loading: false,
    error: null
});

export const eventsStore = {
    subscribe: store.subscribe,

    async loadAll(admin = false) {
        store.update((s) => ({ ...s, loading: true, error: null }));
        try {
            const qs = admin ? '?admin=true' : '';
            const res = await fetch(`/api/evenimente${qs}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error ?? 'Failed to load events');
            store.set({ items: data ?? [], loading: false, error: null });
            return data as EventItem[];
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            store.set({ items: [], loading: false, error: msg });
            return [];
        }
    },

    async getById(id: string) {
        const res = await fetch(`/api/evenimente/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? 'Failed to load event');
        return data as EventItem;
    },

    async update(id: string, patch: Partial<EventItem>) {
        const res = await fetch(`/api/evenimente/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patch)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? 'Failed to update event');
        return data as EventItem;
    },

    async remove(id: string) {
        const res = await fetch(`/api/evenimente/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? 'Failed to delete event');
        return data as { success: true };
    }
};

// Legacy exports used across your pages
export async function getAllEvents(admin = false) {
    return eventsStore.loadAll(admin);
}

export async function getEventById(id: string) {
    return eventsStore.getById(id);
}

export async function updateEvent(id: string, patch: Partial<EventItem>) {
    return eventsStore.update(id, patch);
}

export async function deleteEvent(id: string) {
    return eventsStore.remove(id);
}
