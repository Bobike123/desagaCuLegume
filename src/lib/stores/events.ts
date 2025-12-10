// src/lib/stores/events.ts
import { writable } from "svelte/store";

export type EventType = "piata" | "festival" | "atelier";

export interface Event {
    id: string;
    title: string;
    description: string;
    date: string; // ISO string
    location: string;
    event_type: EventType;
    image_url: string;
}

export const events = writable<Event[]>([]);
export const loading = writable(false);
export const error = writable("");

export async function fetchEvents() {
    loading.set(true);
    try {
        const res = await fetch("/api/evenimente");
        if (!res.ok) throw new Error("Failed to fetch events");
        const data: Event[] = await res.json();
        events.set(data);
    } catch (err: any) {
        error.set(err.message);
    } finally {
        loading.set(false);
    }
}

export async function fetchEventById(id: string) {
    loading.set(true);
    try {
        const res = await fetch(`/api/evenimente/${id}`);
        if (!res.ok) throw new Error("Failed to fetch event");
        const data: Event = await res.json();
        return data;
    } catch (err: any) {
        error.set(err.message);
        return null;
    } finally {
        loading.set(false);
    }
}

export async function createEvent(event: Event) {
    loading.set(true);
    try {
        const res = await fetch("/api/evenimente", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(event),
        });
        if (!res.ok) throw new Error("Failed to create event");
        const newEvent: Event = await res.json();
        events.update((list) => [...list, newEvent]);
        return newEvent;
    } catch (err: any) {
        error.set(err.message);
        return null;
    } finally {
        loading.set(false);
    }
}

export async function updateEvent(id: string, event: Event) {
    loading.set(true);
    try {
        const res = await fetch(`/api/evenimente/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(event),
        });
        if (!res.ok) throw new Error("Failed to update event");
        const updatedEvent: Event = await res.json();
        events.update((list) =>
            list.map((e) => (e.id === id ? updatedEvent : e))
        );
        return updatedEvent;
    } catch (err: any) {
        error.set(err.message);
        return null;
    } finally {
        loading.set(false);
    }
}

export async function deleteEvent(id: string) {
    loading.set(true);
    try {
        const res = await fetch(`/api/evenimente/${id}`, {
            method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to delete event");
        events.update((list) => list.filter((e) => e.id !== id));
        return true;
    } catch (err: any) {
        error.set(err.message);
        return false;
    } finally {
        loading.set(false);
    }
}
