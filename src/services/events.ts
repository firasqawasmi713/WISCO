/**
 * Events and Calendar Service Layer
 * Clean Supabase Live Database Persistence with Optimistic State Management.
 * Zero hardcoded mock/demo data — starts with pure empty state.
 */

import { CalendarEvent, EventPriority, EventType } from '../types';
import { supabase, generateUUID } from './supabase';

const EVENTS_STORAGE_PREFIX = 'wisco_events_v2_';

function mapSupabaseRowToEvent(row: any): CalendarEvent {
  let startDate = new Date().toISOString().split('T')[0];
  let startTime: string | undefined = undefined;

  const rawStart = row.start_time || row.start_date || row.startDate;
  if (rawStart) {
    if (typeof rawStart === 'string' && rawStart.includes('T')) {
      const parts = rawStart.split('T');
      startDate = parts[0];
      const timePart = parts[1].replace('Z', '').split('.')[0];
      if (timePart && timePart.length >= 5) {
        startTime = timePart.substring(0, 5);
      }
    } else {
      startDate = String(rawStart).substring(0, 10);
    }
  }

  let endDate: string | undefined = undefined;
  let endTime: string | undefined = undefined;
  const rawEnd = row.end_time || row.end_date || row.endDate;
  if (rawEnd) {
    if (typeof rawEnd === 'string' && rawEnd.includes('T')) {
      const parts = rawEnd.split('T');
      endDate = parts[0];
      const timePart = parts[1].replace('Z', '').split('.')[0];
      if (timePart && timePart.length >= 5) {
        endTime = timePart.substring(0, 5);
      }
    } else {
      endDate = String(rawEnd).substring(0, 10);
    }
  }

  const rawStatus = row.status || (row.is_completed ? 'completed' : 'event');
  const isCompleted = rawStatus === 'completed' || Boolean(row.is_completed ?? row.isCompleted);
  const type: EventType = row.type || (rawStatus === 'completed' || rawStatus === 'pending' ? 'task' : 'event');

  return {
    id: String(row.id),
    title: row.title || 'Untitled Item',
    description: row.description || '',
    type,
    startDate,
    endDate: endDate || startDate,
    startTime: row.startTime || startTime,
    endTime: row.endTime || endTime,
    allDay: row.all_day ?? row.allDay ?? (!startTime && !endTime),
    category: row.category || 'General',
    color: row.color || (row.priority === 'urgent' ? '#EF4444' : row.priority === 'high' ? '#F59E0B' : '#3B82F6'),
    priority: (row.priority as EventPriority) || 'medium',
    isPinned: Boolean(row.is_pinned ?? row.isPinned),
    isCompleted,
    status: rawStatus,
    location: row.location || '',
    assignedTo: row.assigned_to || row.assignedTo || '',
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString()
  };
}

function mapEventToSupabasePayload(event: CalendarEvent, userId?: string | null) {
  let startTimeISO: string;
  let endTimeISO: string;

  try {
    startTimeISO = event.startTime 
      ? new Date(`${event.startDate}T${event.startTime}:00`).toISOString()
      : new Date(`${event.startDate}T00:00:00`).toISOString();
  } catch {
    startTimeISO = new Date().toISOString();
  }

  const endDateStr = event.endDate || event.startDate;
  try {
    endTimeISO = event.endTime 
      ? new Date(`${endDateStr}T${event.endTime}:00`).toISOString()
      : new Date(`${endDateStr}T23:59:59`).toISOString();
  } catch {
    endTimeISO = new Date().toISOString();
  }

  const status = event.isCompleted ? 'completed' : (event.type === 'task' ? 'pending' : 'event');

  const payload: Record<string, any> = {
    id: event.id,
    title: event.title,
    description: event.description || '',
    type: event.type,
    start_time: startTimeISO,
    end_time: endTimeISO,
    category: event.category || 'General',
    priority: event.priority || 'medium',
    is_pinned: Boolean(event.isPinned),
    status,
    color: event.color || '#3B82F6',
    location: event.location || '',
    assigned_to: event.assignedTo || ''
  };

  if (userId) {
    payload.user_id = userId;
  }

  return payload;
}

export const EventsService = {
  getStorageKey(userId?: string | null): string {
    return `${EVENTS_STORAGE_PREFIX}${userId || 'guest'}`;
  },

  getCachedEvents(userId?: string | null): CalendarEvent[] {
    try {
      const key = this.getStorageKey(userId);
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading cached events:', e);
    }
    return [];
  },

  saveCachedEvents(events: CalendarEvent[], userId?: string | null): void {
    try {
      const key = this.getStorageKey(userId);
      localStorage.setItem(key, JSON.stringify(events));
    } catch (e) {
      console.warn('Error saving cached events:', e);
    }
  },

  // Fetch events from Supabase with optimistic fallback
  async getEvents(userId?: string | null): Promise<CalendarEvent[]> {
    const cached = this.getCachedEvents(userId);

    try {
      // Primary table 'events'
      let query = supabase.from('events').select('*');
      if (userId) {
        query = query.eq('user_id', userId);
      }
      const { data, error } = await query.order('start_time', { ascending: true });

      if (!error && data) {
        const mapped: CalendarEvent[] = data.map(mapSupabaseRowToEvent);
        this.saveCachedEvents(mapped, userId);
        return mapped;
      }

      // Fallback check to 'calendar_events' if 'events' table is not available
      if (error) {
        let altQuery = supabase.from('calendar_events').select('*');
        if (userId) {
          altQuery = altQuery.eq('user_id', userId);
        }
        const altRes = await altQuery.order('created_at', { ascending: false });
        if (!altRes.error && altRes.data) {
          const mapped: CalendarEvent[] = altRes.data.map(mapSupabaseRowToEvent);
          this.saveCachedEvents(mapped, userId);
          return mapped;
        }
      }
    } catch (err) {
      console.warn('Supabase events fetch notice:', err);
    }

    return cached;
  },

  // Fetch upcoming scheduled items (start_time >= today / now)
  async getUpcomingEvents(limit = 5, userId?: string | null): Promise<CalendarEvent[]> {
    const cached = this.getCachedEvents(userId);
    const nowISO = new Date().toISOString();
    const todayStr = nowISO.split('T')[0];

    try {
      let query = supabase.from('events').select('*');
      if (userId) {
        query = query.eq('user_id', userId);
      }
      const { data, error } = await query
        .gte('start_time', todayStr)
        .order('start_time', { ascending: true })
        .limit(limit);

      if (!error && data) {
        return data.map(mapSupabaseRowToEvent);
      }

      if (error) {
        let altQuery = supabase.from('calendar_events').select('*');
        if (userId) {
          altQuery = altQuery.eq('user_id', userId);
        }
        const altRes = await altQuery
          .gte('start_time', todayStr)
          .order('start_time', { ascending: true })
          .limit(limit);
        if (!altRes.error && altRes.data) {
          return altRes.data.map(mapSupabaseRowToEvent);
        }
      }
    } catch (err) {
      console.warn('Supabase upcoming events fetch error:', err);
    }

    return cached
      .filter(e => (e.startDate >= todayStr) || (e.endDate && e.endDate >= todayStr))
      .sort((a, b) => {
        const aTime = `${a.startDate}T${a.startTime || '00:00'}`;
        const bTime = `${b.startDate}T${b.startTime || '00:00'}`;
        return aTime.localeCompare(bTime);
      })
      .slice(0, limit);
  },

  async addEvent(eventData: Omit<CalendarEvent, 'id' | 'createdAt'>, userId?: string | null): Promise<CalendarEvent> {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: generateUUID(),
      createdAt: new Date().toISOString()
    };

    // Optimistic cache update
    const current = this.getCachedEvents(userId);
    const updated = [newEvent, ...current];
    this.saveCachedEvents(updated, userId);

    // Supabase Live Insert
    try {
      const payload = mapEventToSupabasePayload(newEvent, userId);
      const { error } = await supabase.from('events').insert([payload]);
      if (error) {
        // Fallback to calendar_events if table exists
        await supabase.from('calendar_events').insert([payload]);
      }
    } catch (err) {
      console.warn('Supabase event insert notice:', err);
    }

    return newEvent;
  },

  async updateEvent(event: CalendarEvent, userId?: string | null): Promise<CalendarEvent> {
    const updatedEvent: CalendarEvent = {
      ...event,
      updatedAt: new Date().toISOString()
    };

    // Optimistic cache update
    const current = this.getCachedEvents(userId);
    const updated = current.map(e => e.id === updatedEvent.id ? updatedEvent : e);
    this.saveCachedEvents(updated, userId);

    // Supabase Live Update
    try {
      const payload = mapEventToSupabasePayload(updatedEvent, userId);
      let query = supabase.from('events').update(payload).eq('id', updatedEvent.id);
      if (userId) {
        query = query.eq('user_id', userId);
      }
      const { error } = await query;
      if (error) {
        // Fallback to calendar_events
        let altQuery = supabase.from('calendar_events').update(payload).eq('id', updatedEvent.id);
        if (userId) {
          altQuery = altQuery.eq('user_id', userId);
        }
        await altQuery;
      }
    } catch (err) {
      console.warn('Supabase event update notice:', err);
    }

    return updatedEvent;
  },

  async togglePin(eventId: string, isPinned: boolean, userId?: string | null): Promise<CalendarEvent | null> {
    const current = this.getCachedEvents(userId);
    const target = current.find(e => e.id === eventId);
    if (!target) return null;

    const updatedEvent: CalendarEvent = { ...target, isPinned, updatedAt: new Date().toISOString() };
    
    // Optimistic cache update
    const updated = current.map(e => e.id === eventId ? updatedEvent : e);
    this.saveCachedEvents(updated, userId);

    // Supabase Live Toggle
    try {
      let query = supabase.from('events').update({ is_pinned: isPinned }).eq('id', eventId);
      if (userId) {
        query = query.eq('user_id', userId);
      }
      const { error } = await query;
      if (error) {
        let altQuery = supabase.from('calendar_events').update({ is_pinned: isPinned }).eq('id', eventId);
        if (userId) {
          altQuery = altQuery.eq('user_id', userId);
        }
        await altQuery;
      }
    } catch (err) {
      console.warn('Supabase event toggle pin notice:', err);
    }

    return updatedEvent;
  },

  async toggleCompleted(eventId: string, isCompleted: boolean, userId?: string | null): Promise<CalendarEvent | null> {
    const current = this.getCachedEvents(userId);
    const target = current.find(e => e.id === eventId);
    if (!target) return null;

    const newStatus = isCompleted ? 'completed' : (target.type === 'task' ? 'pending' : 'event');
    const updatedEvent: CalendarEvent = { 
      ...target, 
      isCompleted, 
      status: newStatus,
      updatedAt: new Date().toISOString() 
    };
    
    // Optimistic cache update
    const updated = current.map(e => e.id === eventId ? updatedEvent : e);
    this.saveCachedEvents(updated, userId);

    // Supabase Live Status Update
    try {
      let query = supabase.from('events').update({ 
        status: newStatus,
        is_completed: isCompleted 
      }).eq('id', eventId);
      if (userId) {
        query = query.eq('user_id', userId);
      }
      const { error } = await query;
      if (error) {
        let altQuery = supabase.from('calendar_events').update({ 
          status: newStatus,
          is_completed: isCompleted 
        }).eq('id', eventId);
        if (userId) {
          altQuery = altQuery.eq('user_id', userId);
        }
        await altQuery;
      }
    } catch (err) {
      console.warn('Supabase event toggle status notice:', err);
    }

    return updatedEvent;
  },

  async deleteEvent(eventId: string, userId?: string | null): Promise<void> {
    // Optimistic cache update
    const current = this.getCachedEvents(userId);
    const updated = current.filter(e => e.id !== eventId);
    this.saveCachedEvents(updated, userId);

    // Supabase Live Delete
    try {
      let query = supabase.from('events').delete().eq('id', eventId);
      if (userId) {
        query = query.eq('user_id', userId);
      }
      const { error } = await query;
      if (error) {
        let altQuery = supabase.from('calendar_events').delete().eq('id', eventId);
        if (userId) {
          altQuery = altQuery.eq('user_id', userId);
        }
        await altQuery;
      }
    } catch (err) {
      console.warn('Supabase event delete notice:', err);
    }
  }
};
