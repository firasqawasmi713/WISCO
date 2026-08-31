import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Pin, 
  Clock, 
  Search, 
  MapPin, 
  CalendarDays,
  CalendarRange,
  CalendarCheck,
  Check,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Inbox
} from 'lucide-react';
import { CalendarEvent, EventType, EventPriority, LanguageCode } from '../types';
import { TRANSLATIONS } from '../constants/translations';

interface EventsViewProps {
  events: CalendarEvent[];
  onAddEvent: () => void;
  onEditEvent: (event: CalendarEvent) => void;
  onOpenCreateWithDate: (dateStr: string) => void;
  onTogglePin: (eventId: string, isPinned: boolean) => void;
  onToggleCompleted: (eventId: string, isCompleted: boolean) => void;
  lang: LanguageCode;
}

type CalendarViewMode = 'month' | 'week' | 'day';

export const EventsView: React.FC<EventsViewProps> = ({
  events,
  onAddEvent,
  onEditEvent,
  onOpenCreateWithDate,
  onTogglePin,
  onToggleCompleted,
  lang
}) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const isArabic = lang === 'ar';

  // Navigation & View Mode
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showMobilePinnedDrawer, setShowMobilePinnedDrawer] = useState(false);

  // Dynamic category list from user-created events
  const categories = useMemo(() => {
    const set = new Set<string>();
    events.forEach(e => {
      if (e.category) set.add(e.category);
    });
    return Array.from(set);
  }, [events]);

  // Filtered events based on search and category
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const matchesSearch = !searchQuery.trim() || 
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (e.location && e.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (e.assignedTo && e.assignedTo.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat = selectedCategory === 'all' || e.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [events, searchQuery, selectedCategory]);

  // Pinned items sorted by priority and date
  const pinnedEvents = useMemo(() => {
    return events
      .filter(e => e.isPinned)
      .sort((a, b) => {
        const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 };
        const diff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
        if (diff !== 0) return diff;
        return a.startDate.localeCompare(b.startDate);
      });
  }, [events]);

  // Navigation Helpers
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() - 1);
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() - 7);
    } else {
      d.setDate(d.getDate() - 1);
    }
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() + 1);
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() + 7);
    } else {
      d.setDate(d.getDate() + 1);
    }
    setCurrentDate(d);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(today.toISOString().split('T')[0]);
  };

  // Month header text
  const currentMonthYearTitle = useMemo(() => {
    const locale = isArabic ? 'ar-EG' : 'en-US';
    if (viewMode === 'month') {
      return currentDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
    } else if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate);
      const dayIndex = startOfWeek.getDay();
      startOfWeek.setDate(startOfWeek.getDate() - dayIndex);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      return `${startOfWeek.toLocaleDateString(locale, { month: 'short', day: 'numeric' })} – ${endOfWeek.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
  }, [currentDate, viewMode, isArabic]);

  // Calendar month grid calculation (weeks x 7 days)
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startingDayIndex = firstDayOfMonth.getDay();
    const totalDays = lastDayOfMonth.getDate();

    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const days: {
      date: Date;
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      events: CalendarEvent[];
    }[] = [];

    const todayStr = new Date().toISOString().split('T')[0];

    // Previous month padding days
    for (let i = startingDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      const dStr = d.toISOString().split('T')[0];
      days.push({
        date: d,
        dateStr: dStr,
        dayNumber: d.getDate(),
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        isSelected: dStr === selectedDateStr,
        events: filteredEvents.filter(e => e.startDate <= dStr && (e.endDate || e.startDate) >= dStr)
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      const dStr = d.toISOString().split('T')[0];
      days.push({
        date: d,
        dateStr: dStr,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: dStr === todayStr,
        isSelected: dStr === selectedDateStr,
        events: filteredEvents.filter(e => e.startDate <= dStr && (e.endDate || e.startDate) >= dStr)
      });
    }

    // Next month padding days to complete full grid
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const d = new Date(year, month + 1, i);
        const dStr = d.toISOString().split('T')[0];
        days.push({
          date: d,
          dateStr: dStr,
          dayNumber: i,
          isCurrentMonth: false,
          isToday: dStr === todayStr,
          isSelected: dStr === selectedDateStr,
          events: filteredEvents.filter(e => e.startDate <= dStr && (e.endDate || e.startDate) >= dStr)
        });
      }
    }

    return days;
  }, [currentDate, filteredEvents, selectedDateStr]);

  // Week days calculation
  const weekDays = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const start = new Date(d);
    start.setDate(d.getDate() - day);

    const todayStr = new Date().toISOString().split('T')[0];
    const days = [];

    for (let i = 0; i < 7; i++) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);
      const dStr = current.toISOString().split('T')[0];
      days.push({
        date: current,
        dateStr: dStr,
        dayName: current.toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', { weekday: 'short' }),
        dayNumber: current.getDate(),
        isToday: dStr === todayStr,
        isSelected: dStr === selectedDateStr,
        events: filteredEvents.filter(e => e.startDate <= dStr && (e.endDate || e.startDate) >= dStr)
      });
    }
    return days;
  }, [currentDate, filteredEvents, selectedDateStr, isArabic]);

  // Day View events
  const dayEvents = useMemo(() => {
    const dStr = currentDate.toISOString().split('T')[0];
    return filteredEvents.filter(e => e.startDate <= dStr && (e.endDate || e.startDate) >= dStr);
  }, [currentDate, filteredEvents]);

  const weekdayNames = isArabic
    ? ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header Card - Adaptive Light / Midnight Dark with Glowing Borders */}
      <div className="bg-white dark:bg-[#0B1528] border border-slate-200 dark:border-blue-500/20 rounded-3xl p-6 shadow-[0_4px_25px_rgba(0,0,0,0.06)] dark:shadow-[0_0_20px_rgba(59,130,246,0.15)] relative overflow-hidden transition-all duration-300">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {t.events}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t.eventsSubtitle}
            </p>
          </div>

          {/* Quick Action Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-[#101F3C] p-1 border border-slate-200 dark:border-blue-500/20 rounded-2xl shadow-inner">
              <button
                id="btn-view-month"
                type="button"
                onClick={() => setViewMode('month')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'month'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                {t.monthView}
              </button>
              <button
                id="btn-view-week"
                type="button"
                onClick={() => setViewMode('week')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'week'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CalendarRange className="w-3.5 h-3.5" />
                {t.weekView}
              </button>
              <button
                id="btn-view-day"
                type="button"
                onClick={() => setViewMode('day')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'day'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                {t.dayView}
              </button>
            </div>

            {/* Mobile Pinned Items Drawer Toggle Button */}
            <button
              type="button"
              onClick={() => setShowMobilePinnedDrawer(true)}
              className="lg:hidden px-3.5 py-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition cursor-pointer"
            >
              <Pin className="w-3.5 h-3.5 fill-amber-500 text-amber-500 dark:fill-amber-400 dark:text-amber-400" />
              <span>{t.pinnedCount} ({pinnedEvents.length})</span>
            </button>

            {/* Primary Add Event Button */}
            <button
              id="btn-add-event-main"
              type="button"
              onClick={onAddEvent}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-500/25 dark:shadow-[0_0_15px_rgba(56,189,248,0.25)] transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              {t.addEvent}
            </button>
          </div>
        </div>

        {/* Date Navigation & Search Sub-bar */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Month / Week Navigation Controls */}
          <div className="flex items-center gap-2">
            <button
              id="btn-cal-prev"
              type="button"
              onClick={handlePrev}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-[#101F3C] hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition cursor-pointer shadow-xs"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              id="btn-cal-today"
              type="button"
              onClick={handleToday}
              className="px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-[#101F3C] hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition cursor-pointer shadow-xs"
            >
              {t.today}
            </button>

            <button
              id="btn-cal-next"
              type="button"
              onClick={handleNext}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-[#101F3C] hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition cursor-pointer shadow-xs"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white ml-2 rtl:mr-2 tracking-tight">
              {currentMonthYearTitle}
            </h2>
          </div>

          {/* Search and Category Tag Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 rtl:right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchEvents}
                className="w-full bg-slate-50 dark:bg-[#101F3C] border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 rtl:pr-9 rtl:pl-4 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 rtl:left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {categories.length > 0 && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-50 dark:bg-[#101F3C] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer shadow-xs"
              >
                <option value="all">{t.filterAll}</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Layout: Equal Height Stretch Grid (Calendar + Pinned Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Main Calendar View Area (8 cols on desktop) */}
        <div className="lg:col-span-8 bg-white dark:bg-[#0B1528] border border-slate-200 dark:border-blue-500/20 rounded-3xl p-4 sm:p-6 shadow-[0_4px_25px_rgba(0,0,0,0.06)] dark:shadow-[0_0_20px_rgba(59,130,246,0.15)] flex flex-col justify-between transition-all duration-300">
          {/* 1. MONTH VIEW */}
          {viewMode === 'month' && (
            <div className="space-y-2">
              {/* Day header row */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
                {weekdayNames.map((dName, idx) => (
                  <div 
                    key={dName} 
                    className={`py-2 text-[11px] font-bold uppercase tracking-wider ${
                      idx === 0 || idx === 6 
                        ? 'text-slate-400 dark:text-slate-500' 
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {dName}
                  </div>
                ))}
              </div>

              {/* 7-column calendar cells */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {monthDays.map((day) => {
                  const hasEvents = day.events.length > 0;
                  return (
                    <div
                      key={day.dateStr}
                      id={`cal-cell-${day.dateStr}`}
                      onClick={() => onOpenCreateWithDate(day.dateStr)}
                      className={`min-h-[85px] sm:min-h-[110px] p-1.5 sm:p-2 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between group relative ${
                        day.isCurrentMonth
                          ? 'bg-slate-50/60 dark:bg-[#101F3C]/40 hover:bg-blue-50/50 dark:hover:bg-[#101F3C]/80 border-slate-200/80 dark:border-slate-700/50 hover:border-blue-400 dark:hover:border-blue-500/50'
                          : 'bg-slate-100/30 dark:bg-[#0B1528]/40 opacity-40 border-slate-200/40 dark:border-slate-800/40'
                      } ${
                        day.isToday
                          ? 'ring-2 ring-blue-500 bg-blue-50/70 dark:bg-blue-950/30 shadow-md shadow-blue-500/10'
                          : ''
                      }`}
                    >
                      {/* Top Bar of Date Cell: Number & Indicators */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold rounded-lg px-1.5 py-0.5 ${
                            day.isToday
                              ? 'bg-blue-600 text-white shadow-xs'
                              : day.isCurrentMonth
                              ? 'text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-white'
                              : 'text-slate-400 dark:text-slate-600'
                          }`}
                        >
                          {day.dayNumber}
                        </span>

                        {hasEvents && (
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-1 rounded-md border border-slate-200 dark:border-slate-700/60 hidden sm:inline-block">
                            {day.events.length}
                          </span>
                        )}
                      </div>

                      {/* Event Chips List */}
                      <div className="space-y-1 my-1 overflow-hidden max-h-[60px] sm:max-h-[75px] custom-scrollbar">
                        {day.events.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            id={`event-chip-${event.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditEvent(event);
                            }}
                            className="px-1.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-medium border truncate transition-all flex items-center justify-between gap-1 shadow-2xs hover:brightness-110"
                            style={{
                              backgroundColor: `${event.color}15`,
                              borderColor: `${event.color}40`,
                              color: event.color
                            }}
                            title={`${event.title} (${event.category})`}
                          >
                            <div className="flex items-center gap-1 truncate">
                              <span 
                                className="w-1.5 h-1.5 rounded-full shrink-0" 
                                style={{ backgroundColor: event.color }} 
                              />
                              <span className={`truncate ${event.isCompleted ? 'line-through opacity-70' : ''}`}>
                                {event.title}
                              </span>
                            </div>

                            {event.isPinned && (
                              <Pin className="w-2.5 h-2.5 shrink-0 fill-amber-500 text-amber-500 dark:fill-amber-400 dark:text-amber-400" />
                            )}
                          </div>
                        ))}

                        {day.events.length > 3 && (
                          <div className="text-[9px] font-bold text-slate-500 dark:text-slate-400 px-1 py-0.5 text-center bg-white dark:bg-slate-800/80 rounded border border-slate-200 dark:border-slate-700">
                            +{day.events.length - 3} {isArabic ? 'المزيد' : 'more'}
                          </div>
                        )}
                      </div>

                      {/* Quick Hover Add Icon */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-0.5">
                          <Plus className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. WEEK VIEW */}
          {viewMode === 'week' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
                {weekDays.map((day) => {
                  return (
                    <div
                      key={day.dateStr}
                      className={`p-3 rounded-2xl border flex flex-col min-h-[320px] ${
                        day.isToday
                          ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-500/60 shadow-xs'
                          : 'bg-slate-50/70 dark:bg-[#101F3C]/40 border-slate-200 dark:border-slate-700/60'
                      }`}
                    >
                      {/* Day Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700/60 mb-2">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block">
                            {day.dayName}
                          </span>
                          <span className={`text-base font-black ${day.isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>
                            {day.dayNumber}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onOpenCreateWithDate(day.dateStr)}
                          className="p-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs transition cursor-pointer border border-slate-200 dark:border-slate-700"
                          title="Add item"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Day Events Stack */}
                      <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                        {day.events.length === 0 ? (
                          <div className="text-[11px] text-slate-400 italic text-center py-6">
                            {isArabic ? 'فارغ' : 'No items'}
                          </div>
                        ) : (
                          day.events.map((event) => (
                            <div
                              key={event.id}
                              onClick={() => onEditEvent(event)}
                              className="p-2.5 rounded-xl border transition-all cursor-pointer hover:shadow-md hover:scale-[1.02] flex flex-col gap-1.5"
                              style={{
                                backgroundColor: `${event.color}15`,
                                borderColor: `${event.color}40`
                              }}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <span className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2">
                                  {event.title}
                                </span>
                                {event.isPinned && (
                                  <Pin className="w-3 h-3 fill-amber-500 text-amber-500 dark:fill-amber-400 dark:text-amber-400 shrink-0 mt-0.5" />
                                )}
                              </div>

                              {event.startTime && (
                                <div className="flex items-center gap-1 text-[10px] text-slate-600 dark:text-slate-300">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span>{event.startTime}{event.endTime ? ` - ${event.endTime}` : ''}</span>
                                </div>
                              )}

                              <div className="flex items-center justify-between text-[10px] pt-1">
                                <span 
                                  className="px-1.5 py-0.5 rounded font-bold"
                                  style={{ backgroundColor: `${event.color}25`, color: event.color }}
                                >
                                  {event.category}
                                </span>
                                {event.type === 'task' && (
                                  <span className={`text-[10px] font-semibold ${event.isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                    {event.isCompleted ? '✓' : '●'}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. DAY VIEW */}
          {viewMode === 'day' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#101F3C]/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {currentDate.toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {dayEvents.length} {isArabic ? 'عناصر مجدولة لهذا اليوم' : 'items scheduled for this day'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenCreateWithDate(currentDate.toISOString().split('T')[0])}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t.addEvent}
                </button>
              </div>

              {dayEvents.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-700/80 rounded-2xl bg-slate-50/50 dark:bg-[#101F3C]/20">
                  <CalendarIcon className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{t.noEventsForDay}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{isArabic ? 'انقر على إضافة لجدولة موعد أو مهمة جديدة' : 'Click add to schedule a meeting, task, or deliverable.'}</p>
                  <button
                    type="button"
                    onClick={() => onOpenCreateWithDate(currentDate.toISOString().split('T')[0])}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                  >
                    {t.addEvent}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => onEditEvent(event)}
                      className="p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      style={{
                        backgroundColor: `${event.color}10`,
                        borderColor: `${event.color}40`
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
                          style={{ backgroundColor: `${event.color}25`, color: event.color }}
                        >
                          <CalendarIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className={`text-sm font-bold text-slate-900 dark:text-white ${event.isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                              {event.title}
                            </h4>
                            <span 
                              className="px-2 py-0.5 text-[10px] font-bold rounded-md uppercase"
                              style={{ backgroundColor: `${event.color}25`, color: event.color }}
                            >
                              {event.category}
                            </span>
                            {event.priority === 'urgent' && (
                              <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30 rounded uppercase">
                                Urgent
                              </span>
                            )}
                          </div>

                          {event.description && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                              {event.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                            {event.startTime && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                {event.startTime}{event.endTime ? ` – ${event.endTime}` : ''}
                              </span>
                            )}
                            {event.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                {event.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Interactive Controls */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {event.type === 'task' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleCompleted(event.id, !event.isCompleted);
                            }}
                            className={`p-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                              event.isCompleted 
                                ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            {event.isCompleted ? t.taskCompleted : t.taskPending}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePin(event.id, !event.isPinned);
                          }}
                          className={`p-2 rounded-xl transition cursor-pointer border ${
                            event.isPinned
                              ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/40'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
                          }`}
                          title={event.isPinned ? 'Unpin' : 'Pin to panel'}
                        >
                          <Pin className={`w-4 h-4 ${event.isPinned ? 'fill-amber-500 text-amber-500 dark:fill-amber-400 dark:text-amber-400' : ''}`} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Persistent Pinned Sidebar Panel - Top Aligned & Equal Height Stretch */}
        <div className="hidden lg:flex lg:col-span-4 h-full flex-col">
          <div className="bg-white dark:bg-[#0B1528] border border-slate-200 dark:border-blue-500/20 rounded-3xl p-5 shadow-[0_4px_25px_rgba(0,0,0,0.06)] dark:shadow-[0_0_20px_rgba(59,130,246,0.15)] flex flex-col h-full transition-all duration-300">
            {/* Header */}
            <div className="pb-4 border-b border-slate-200 dark:border-slate-800/80 mb-4 shrink-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                {t.pinnedItems}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {t.pinnedItemsDesc}
              </p>
            </div>

            {/* Pinned Cards Stack with internal scroll area */}
            <div className="flex-1 min-h-[300px] overflow-y-auto max-h-[580px] xl:max-h-[640px] pr-1 space-y-3 custom-scrollbar">
              {pinnedEvents.length === 0 ? (
                <div className="h-full min-h-[260px] flex flex-col items-center justify-center p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-[#101F3C]/20">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center mb-3 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700/50">
                    <Pin className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isArabic ? 'لا توجد أولويات مثبتة' : 'No Pinned Priorities'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-[220px]">
                    {t.noPinnedItems}
                  </p>
                </div>
              ) : (
                pinnedEvents.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onEditEvent(item)}
                    className="p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer bg-slate-50/70 dark:bg-[#101F3C]/50 hover:bg-white dark:hover:bg-[#101F3C]/90 border-slate-200/90 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-blue-500/40 shadow-xs hover:shadow-md dark:shadow-[0_0_15px_rgba(59,130,246,0.08)] group relative overflow-hidden"
                  >
                    {/* Left/Right color highlight strip */}
                    <div 
                      className="absolute top-0 bottom-0 left-0 rtl:right-0 rtl:left-auto w-1"
                      style={{ backgroundColor: item.color }}
                    />

                    <div className="pl-2 rtl:pr-2 rtl:pl-0 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span 
                              className="px-1.5 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider"
                              style={{ backgroundColor: `${item.color}20`, color: item.color }}
                            >
                              {item.category}
                            </span>
                            {item.priority === 'urgent' && (
                              <span className="px-1.5 py-0.5 text-[9px] font-bold bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30 rounded uppercase">
                                Urgent
                              </span>
                            )}
                          </div>
                          <h4 className={`text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition ${item.isCompleted ? 'line-through opacity-60' : ''}`}>
                            {item.title}
                          </h4>
                        </div>

                        {/* Unpin quick button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePin(item.id, false);
                          }}
                          className="p-1 text-amber-500 dark:text-amber-400 hover:text-slate-400 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition cursor-pointer shrink-0"
                          title="Unpin"
                        >
                          <Pin className="w-3.5 h-3.5 fill-amber-500 dark:fill-amber-400" />
                        </button>
                      </div>

                      {item.description && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/80 dark:border-slate-700/40 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {item.startDate}
                        </span>

                        {item.type === 'task' ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleCompleted(item.id, !item.isCompleted);
                            }}
                            className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border transition ${
                              item.isCompleted 
                                ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                                : 'bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            {item.isCompleted ? '✓ Done' : '○ Pending'}
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                            {item.type}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer / Bottom Sheet for Pinned Items */}
      {showMobilePinnedDrawer && (
        <div 
          className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-black/70 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowMobilePinnedDrawer(false)}
        >
          <div 
            className="bg-white dark:bg-[#0B1528] border-t border-slate-200 dark:border-blue-500/30 rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Pin className="w-4 h-4 fill-amber-500 text-amber-500 dark:fill-amber-400 dark:text-amber-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t.pinnedItems}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMobilePinnedDrawer(false)}
                className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {pinnedEvents.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t.noPinnedItems}</p>
                </div>
              ) : (
                pinnedEvents.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setShowMobilePinnedDrawer(false);
                      onEditEvent(item);
                    }}
                    className="p-3.5 bg-slate-50 dark:bg-[#101F3C]/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2 cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{item.title}</h4>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTogglePin(item.id, false);
                        }}
                        className="text-amber-500 dark:text-amber-400 p-1"
                      >
                        <Pin className="w-3.5 h-3.5 fill-amber-500 dark:fill-amber-400" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                      <span>{item.startDate}</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{item.category}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
