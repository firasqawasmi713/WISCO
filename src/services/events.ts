/**
 * Events and Calendar Service Layer
 * Provides modular CRUD operations with Supabase integration and offline fallback persistence.
 */

import { CalendarEvent } from '../types';
import { supabase, generateUUID } from './supabase';

const EVENTS_STORAGE_PREFIX = 'wisco_events_';

// Generate dynamic realistic mock events centered on the active month
export function getInitialMockEvents(): CalendarEvent[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  const formatDate = (offsetDays: number) => {
    const d = new Date(year, month, day + offsetDays);
    return d.toISOString().split('T')[0];
  };

  return [
    {
      id: 'mock-event-1',
      title: 'Q3 Agency Financial & Profit Review',
      description: 'Quarterly board meeting to audit profit margins, client billings, and direct spendings across active engagements.',
      type: 'event',
      startDate: formatDate(0),
      endDate: formatDate(0),
      startTime: '10:00',
      endTime: '11:30',
      allDay: false,
      category: 'Financial Review',
      color: '#3B82F6', // Blue
      priority: 'high',
      isPinned: true,
      location: 'Main Conference Room (Amman Headquarters)',
      assignedTo: 'Executive Team',
      createdAt: new Date().toISOString()
    },
    {
      id: 'mock-event-2',
      title: 'Deliver Brand Identity Assets to TechCorp',
      description: 'Handover finalized vector deliverables, invoice INV-0045, and brand guideline document.',
      type: 'task',
      startDate: formatDate(1),
      endDate: formatDate(1),
      startTime: '14:00',
      endTime: '16:00',
      allDay: false,
      category: 'Deliverables',
      color: '#EF4444', // Red
      priority: 'urgent',
      isPinned: true,
      isCompleted: false,
      location: 'Client Portal',
      assignedTo: 'Design Lead',
      createdAt: new Date().toISOString()
    },
    {
      id: 'mock-event-3',
      title: 'Monthly Tax & VAT Filing Submission',
      description: 'Submit monthly sales tax and corporate withholdings declarations to the tax authority portal.',
      type: 'deadline',
      startDate: formatDate(3),
      endDate: formatDate(3),
      startTime: '09:00',
      endTime: '12:00',
      allDay: true,
      category: 'Tax & Compliance',
      color: '#F59E0B', // Amber
      priority: 'high',
      isPinned: true,
      isCompleted: false,
      location: 'Government Tax Portal',
      assignedTo: 'Chief Accountant',
      createdAt: new Date().toISOString()
    },
    {
      id: 'mock-event-4',
      title: 'New Client Strategy & Onboarding Call',
      description: 'Introductory scope workshop with Apex Horizon executives to define project milestones and payment tranches.',
      type: 'event',
      startDate: formatDate(5),
      endDate: formatDate(5),
      startTime: '15:00',
      endTime: '16:30',
      allDay: false,
      category: 'Client Meeting',
      color: '#10B981', // Emerald
      priority: 'medium',
      isPinned: false,
      location: 'Google Meet / Zoom',
      assignedTo: 'Account Director',
      createdAt: new Date().toISOString()
    },
    {
      id: 'mock-event-5',
      title: 'Jordan Fintech & Banking Summit',
      description: 'Annual conference focusing on regional payment gateways, digital invoicing, and SME financial tooling.',
      type: 'milestone',
      startDate: formatDate(-2),
      endDate: formatDate(-2),
      allDay: true,
      category: 'Conference',
      color: '#8B5CF6', // Purple
      priority: 'medium',
      isPinned: false,
      location: 'Kempinski Hotel Amman',
      assignedTo: 'All Partners',
      createdAt: new Date().toISOString()
    },
    {
      id: 'mock-event-6',
      title: 'WISCO Platform v2.7 Release Milestone',
      description: 'Deploy real-time calendar and notifications architecture into production cluster.',
      type: 'milestone',
      startDate: formatDate(10),
      endDate: formatDate(10),
      allDay: true,
      category: 'Engineering',
      color: '#06B6D4', // Cyan
      priority: 'high',
      isPinned: false,
      location: 'Cloud Ingress',
      assignedTo: 'Tech Lead',
      createdAt: new Date().toISOString()
    }
  ];
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
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading cached events:', e);
    }
    const initial = getInitialMockEvents();
    this.saveCachedEvents(initial, userId);
    return initial;
  },

  saveCachedEvents(events: CalendarEvent[], userId?: string | null): void {
    try {
      const key = this.getStorageKey(userId);
      localStorage.setItem(key, JSON.stringify(events));
    } catch (e) {
      console.warn('Error saving cached events:', e);
    }
  },

  // Fetch events from Supabase with fallback to cached/initial mock events
  async getEvents(userId?: string | null): Promise<CalendarEvent[]> {
    const cached = this.getCachedEvents(userId);
    if (!userId) {
      return cached;
    }

    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', userId)
        .order('start_date', { ascending: true });

      if (error) {
        // Table might not exist yet in Supabase instance or schema not provisioned
        console.warn('Supabase calendar_events fetch notice:', error.message);
        return cached;
      }

      if (data && data.length > 0) {
        const mapped: CalendarEvent[] = data.map((row: any) => ({
          id: String(row.id),
          title: row.title || 'Untitled Event',
          description: row.description || '',
          type: row.type || 'event',
          startDate: row.start_date || row.startDate || new Date().toISOString().split('T')[0],
          endDate: row.end_date || row.endDate || undefined,
          startTime: row.start_time || row.startTime || undefined,
          endTime: row.end_time || row.endTime || undefined,
          allDay: row.all_day ?? row.allDay ?? false,
          category: row.category || 'General',
          color: row.color || '#3B82F6',
          priority: row.priority || 'medium',
          isPinned: row.is_pinned ?? row.isPinned ?? false,
          isCompleted: row.is_completed ?? row.isCompleted ?? false,
          location: row.location || '',
          assignedTo: row.assigned_to || row.assignedTo || '',
          createdAt: row.created_at || new Date().toISOString(),
          updatedAt: row.updated_at || new Date().toISOString()
        }));
        this.saveCachedEvents(mapped, userId);
        return mapped;
      }
    } catch (err) {
      console.warn('Events fetch exception:', err);
    }

    return cached;
  },

  async addEvent(eventData: Omit<CalendarEvent, 'id' | 'createdAt'>, userId?: string | null): Promise<CalendarEvent> {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: generateUUID(),
      createdAt: new Date().toISOString()
    };

    // Update local cache immediately
    const current = this.getCachedEvents(userId);
    const updated = [newEvent, ...current];
    this.saveCachedEvents(updated, userId);

    if (userId) {
      try {
        const payload = {
          id: newEvent.id,
          user_id: userId,
          title: newEvent.title,
          description: newEvent.description || '',
          type: newEvent.type,
          start_date: newEvent.startDate,
          end_date: newEvent.endDate || null,
          start_time: newEvent.startTime || null,
          end_time: newEvent.endTime || null,
          all_day: newEvent.allDay,
          category: newEvent.category,
          color: newEvent.color,
          priority: newEvent.priority,
          is_pinned: newEvent.isPinned,
          is_completed: newEvent.isCompleted || false,
          location: newEvent.location || '',
          assigned_to: newEvent.assignedTo || '',
          created_at: newEvent.createdAt,
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase.from('calendar_events').insert([payload]);
        if (error) {
          console.warn('Supabase calendar_events insert notice:', error.message);
        }
      } catch (err) {
        console.warn('Failed to insert into Supabase calendar_events:', err);
      }
    }

    return newEvent;
  },

  async updateEvent(event: CalendarEvent, userId?: string | null): Promise<CalendarEvent> {
    const updatedEvent: CalendarEvent = {
      ...event,
      updatedAt: new Date().toISOString()
    };

    const current = this.getCachedEvents(userId);
    const updated = current.map(e => e.id === updatedEvent.id ? updatedEvent : e);
    this.saveCachedEvents(updated, userId);

    if (userId) {
      try {
        const payload = {
          title: updatedEvent.title,
          description: updatedEvent.description || '',
          type: updatedEvent.type,
          start_date: updatedEvent.startDate,
          end_date: updatedEvent.endDate || null,
          start_time: updatedEvent.startTime || null,
          end_time: updatedEvent.endTime || null,
          all_day: updatedEvent.allDay,
          category: updatedEvent.category,
          color: updatedEvent.color,
          priority: updatedEvent.priority,
          is_pinned: updatedEvent.isPinned,
          is_completed: updatedEvent.isCompleted || false,
          location: updatedEvent.location || '',
          assigned_to: updatedEvent.assignedTo || '',
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('calendar_events')
          .update(payload)
          .eq('id', updatedEvent.id)
          .eq('user_id', userId);

        if (error) {
          console.warn('Supabase calendar_events update notice:', error.message);
        }
      } catch (err) {
        console.warn('Failed to update Supabase calendar_events:', err);
      }
    }

    return updatedEvent;
  },

  async togglePin(eventId: string, isPinned: boolean, userId?: string | null): Promise<CalendarEvent | null> {
    const current = this.getCachedEvents(userId);
    const target = current.find(e => e.id === eventId);
    if (target) {
      return await this.updateEvent({ ...target, isPinned }, userId);
    }
    return null;
  },

  async toggleCompleted(eventId: string, isCompleted: boolean, userId?: string | null): Promise<CalendarEvent | null> {
    const current = this.getCachedEvents(userId);
    const target = current.find(e => e.id === eventId);
    if (target) {
      return await this.updateEvent({ ...target, isCompleted }, userId);
    }
    return null;
  },

  async deleteEvent(eventId: string, userId?: string | null): Promise<void> {
    const current = this.getCachedEvents(userId);
    const updated = current.filter(e => e.id !== eventId);
    this.saveCachedEvents(updated, userId);

    if (userId) {
      try {
        const { error } = await supabase
          .from('calendar_events')
          .delete()
          .eq('id', eventId)
          .eq('user_id', userId);

        if (error) {
          console.warn('Supabase calendar_events delete notice:', error.message);
        }
      } catch (err) {
        console.warn('Failed to delete from Supabase calendar_events:', err);
      }
    }
  }
};
