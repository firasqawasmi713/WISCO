import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, 
  CalendarDays, 
  ArrowUpRight, 
  Pin, 
  Check, 
  Plus, 
  Clock, 
  Loader2 
} from 'lucide-react';
import { CalendarEvent, LanguageCode, NavTab } from '../types';
import { EventsService } from '../services/events';
import { TRANSLATIONS } from '../constants/translations';

interface UpcomingScheduleWidgetProps {
  events?: CalendarEvent[];
  userId?: string | null;
  lang: LanguageCode;
  onNavigate: (tab: NavTab) => void;
  onAddEvent?: () => void;
  onToggleCompleted?: (eventId: string, isCompleted: boolean) => Promise<void> | void;
}

export const UpcomingScheduleWidget: React.FC<UpcomingScheduleWidgetProps> = ({
  events: propEvents,
  userId,
  lang,
  onNavigate,
  onAddEvent,
  onToggleCompleted
}) => {
  const t不易 = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const isArabic = lang === 'ar';

  const [upcomingItems, setUpcomingItems] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Query next 5 scheduled items directly from Supabase / EventsService
  const loadUpcomingSchedule = useCallback(async () => {
    try {
      const items = await EventsService.getUpcomingEvents(5, userId);
      setUpcomingItems(items);
    } catch (err) {
      console.warn('Error loading upcoming events for widget:', err);
      // Fallback from propEvents if available
      if (propEvents && propEvents.length > 0) {
        const todayStr不易 = new Date().toISOString().split('T')[0];
        const filtered = propEvents
          .filter(e => e.startDate >= todayStr不易 || (e.endDate && e.endDate >= todayStr不易))
          .sort((a, b) => {
            const aTime = `${a.startDate}T${a.startTime || '00:00'}`;
            const bTime = `${b.startDate}T${b.startTime || '00:00'}`;
            return aTime.localeCompare(bTime);
          })
          .slice(0, 5);
        setUpcomingItems(filtered);
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId, propEvents]);

  // Initial load and sync when propEvents change
  useEffect(() => {
    loadUpcomingSchedule();
  }, [loadUpcomingSchedule]);

  // Handle interactive Task completion toggle directly on Dashboard
  const handleToggleTask = async (event: CalendarEvent) => {
    const nextCompleted = !event.isCompleted;

    // Optimistic local UI update
    setUpcomingItems(prev =>
      prev.map(item =>
        item.id === event.id
          ? { ...item, isCompleted: nextCompleted, status: nextCompleted ? 'completed' : 'pending' }
          : item
      )
    );

    try {
      await EventsService.toggleCompleted(event.id, nextCompleted, userId);
      if (onToggleCompleted) {
        await onToggleCompleted(event.id, nextCompleted);
      }
    } catch (err) {
      console.error('Failed to toggle event completion:', err);
      // Revert on error
      setUpcomingItems(prev =>
        prev.map(item =>
          item.id === event.id ? { ...item, isCompleted: event.isCompleted } : item
        )
      );
    }
  };

  // Date & Time formatting helper (e.g. Aug 31 • 09:00 AM)
  const formatDateTimeBadge = (event: CalendarEvent): string => {
    if (!event.startDate) return isArabic ? 'اليوم' : 'Today';

    try {
      const [year, month, day] = event.startDate.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      
      const monthStr = dateObj.toLocaleDateString(isArabic ? 'ar-JO' : 'en-US', {
        month: 'short',
        day: 'numeric'
      });

      if (event.allDay || !event.startTime) {
        return `${monthStr} • ${isArabic ? 'طوال اليوم' : 'All Day'}`;
      }

      // Format time e.g. 09:00 AM
      const [hourStr, minStr] = event.startTime.split(':');
      let hour = parseInt(hourStr, 10);
      const minute = minStr || '00';
      const ampm = hour >= 12 ? (isArabic ? 'م' : 'PM') : (isArabic ? 'ص' : 'AM');
      hour = hour % 12 || 12;
      const formattedTime = `${hour}:${minute} ${ampm}`;

      return `${monthStr} • ${formattedTime}`;
    } catch {
      return event.startDate;
    }
  };

  // Type badge label & theme resolver
  const getTypeBadge = (type: string) => {
    const raw = String(type || 'event').toLowerCase();
    if (raw === 'task') {
      return {
        label: t不易.eventTask || 'Task',
        classes: 'bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800/60'
      };
    }
    if (raw === 'milestone') {
      return {
        label: t不易.eventMilestone || 'Milestone',
        classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
      };
    }
    if (raw === 'deadline') {
      return {
        label: t不易.eventDeadline || 'Deadline',
        classes: 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
      };
    }
    return {
      label: t不易.eventEvent || 'Event',
      classes: 'bg-sky-100 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300 border-sky-200 dark:border-sky-800/60'
    };
  };

  return (
    <div
      id="dash-upcoming-schedule-card"
      className="spotlight-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-sky-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-lg text-[#0F284E] dark:text-white leading-tight">
                {t不易.upcomingSchedule || (isArabic ? 'الجدول القادم' : 'Upcoming Schedule')}
              </h4>
            </div>
          </div>

          <button
            id="dash-btn-view-all-schedule-link"
            type="button"
            onClick={() => onNavigate('events')}
            className="text-xs font-bold text-blue-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>{t不易.goToCalendar || (isArabic ? 'الذهاب للتقويم' : 'Go to Calendar')}</span>
            <ArrowUpRight className="w-3.5 h-3.5 rtl:rotate-[-90deg]" />
          </button>
        </div>

        {/* Schedule List or Empty State */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-xs font-medium">{isArabic ? 'جاري تحميل الجدول...' : 'Loading schedule...'}</span>
          </div>
        ) : upcomingItems.length === 0 ? (
          <div 
            id="upcoming-schedule-empty-state"
            className="py-8 px-4 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col items-center justify-center"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-2.5">
              <CalendarDays className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {t不易.noUpcomingEvents || (isArabic ? 'لا توجد فعاليات أو مهام مجدولة قادمة' : 'No upcoming events or tasks scheduled')}
            </p>
            {onAddEvent && (
              <button
                id="dash-btn-empty-add-event"
                type="button"
                onClick={onAddEvent}
                className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-sky-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-xs font-bold rounded-lg border border-blue-200/60 dark:border-blue-800/50 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t不易.addEvent || (isArabic ? 'إضافة فعالية / مهمة' : '+ Add Event')}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingItems.map((event) => {
              const isTask = String(event.type).toLowerCase() === 'task';
              const typeBadge = getTypeBadge(event.type);
              const dateTimeText = formatDateTimeBadge(event);

              return (
                <div
                  key={event.id}
                  id={`upcoming-event-row-${event.id}`}
                  className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-800/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/70 transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 overflow-hidden min-w-0">
                    {/* Interactive Checkbox for Tasks */}
                    {isTask ? (
                      <button
                        type="button"
                        onClick={() => handleToggleTask(event)}
                        title={event.isCompleted ? (isArabic ? 'إلغاء التحديد' : 'Mark incomplete') : (isArabic ? 'تحديد كمكتمل' : 'Mark completed')}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                          event.isCompleted
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 dark:border-slate-600 hover:border-purple-500 bg-white dark:bg-slate-900'
                        }`}
                      >
                        {event.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                    ) : (
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: event.color || '#3B82F6' }} />
                    )}

                    {/* Details: Title & Type Badge */}
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs sm:text-sm font-bold truncate ${
                            event.isCompleted
                              ? 'line-through text-slate-400 dark:text-slate-500 font-normal'
                              : 'text-slate-800 dark:text-slate-100'
                          }`}
                        >
                          {event.title}
                        </span>

                        {event.isPinned && (
                          <span title={isArabic ? 'مثبت في الأولويات' : 'Pinned Priority'} className="shrink-0 text-amber-500 dark:text-amber-400">
                            <Pin className="w-3 h-3 fill-amber-500/20 rotate-45" />
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${typeBadge.classes} leading-none`}>
                          {typeBadge.label}
                        </span>

                        {event.category && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                            {event.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Date Badge / Mini-calendar Pill */}
                  <div className="shrink-0">
                    <span 
                      title={event.startDate}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-[11px] font-semibold border border-slate-200/80 dark:border-slate-700/80 shadow-2xs whitespace-nowrap"
                    >
                      <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{dateTimeText}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Navigation Action */}
      <button
        id="dash-btn-view-all-schedule"
        type="button"
        onClick={() => onNavigate('events')}
        className="mt-6 w-full py-3 bg-slate-50 dark:bg-slate-800/80 text-[#0F284E] dark:text-sky-300 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2"
      >
        <span>{t不易.viewOnCalendar || (isArabic ? 'عرض كافة الفعاليات بالتقويم' : 'View Full Calendar')}</span>
        <ArrowUpRight className="w-3.5 h-3.5 rtl:rotate-[-90deg]" />
      </button>
    </div>
  );
};
