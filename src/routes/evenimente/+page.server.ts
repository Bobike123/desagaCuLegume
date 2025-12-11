import { getAllEvents } from '$lib/stores/events';

export async function load() {
    try {
        const events = await getAllEvents();
        const published = events.filter((e) => e.published === true);

        return {
            events: published
        };
    } catch (err) {
        console.error('Error loading events:', err);
        return {
            events: []
        };
    }
}
