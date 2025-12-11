// src/lib/server/events.ts
import { supabaseServer } from '$lib/api/supabase';
export const supabaseAdmin = supabaseServer();

export interface Event {
    id: string;  // remove the ?
    title: string;
    description: string;
    location: string;
    date: string | Date;
    image_url: string;
    event_type: string;
    created_at?: string | Date;
    published: boolean;
}


export async function getAllEvents() {
    const { data, error } = await supabaseAdmin
        .from('events')
        .select('*')
        .order('date', { ascending: true });

    if (error) throw new Error(error.message);
    return data as Event[];
}

export async function getEventById(id: string) {
    const { data, error } = await supabaseAdmin
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw new Error(error.message);
    return data as Event;
}

export async function createEvent(event: Omit<Event, 'id' | 'created_at'>) {
    const { data, error } = await supabaseAdmin
        .from('events')
        .insert(event)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data as Event;
}

export async function updateEvent(id: string, event: Partial<Event>) {
    const { data, error } = await supabaseAdmin
        .from('events')
        .update(event)
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data as Event;
}

export async function deleteEvent(id: string) {
    const { error } = await supabaseAdmin
        .from('events')
        .delete()
        .eq('id', id);

    if (error) throw new Error(error.message);
    return true;
}
