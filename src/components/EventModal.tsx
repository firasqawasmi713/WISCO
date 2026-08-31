import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar as CalendarIcon, 
  Clock, 
  Tag, 
  CheckSquare, 
  Pin, 
  MapPin, 
  User, 
  AlignLeft, 
  Trash2, 
  AlertCircle,
  Flag,
  Sparkles
} from 'lucide-react';
import { CalendarEvent, EventType, EventPriority, LanguageCode } from '../types';
import { TRANSLATIONS } from '../constants/translations';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: Omit<CalendarEvent, 'id' | 'createdAt'> | CalendarEvent) => void;
  onDelete?: (eventId: string) => void;
  initialEvent?: CalendarEvent | null;
  initialDate?: string;
  lang: LanguageCode;
}

const COLOR_PRESETS = [
  { name: 'Blue', hex: '#3B82F6', bg: 'bg-blue-500' },
  { name: 'Emerald', hex: '#10B981', bg: 'bg-emerald-500' },
  { name: 'Amber', hex: '#F59E0B', bg: 'bg-amber-500' },
  { name: 'Red / Urgent', hex: '#EF4444', bg: 'bg-red-500' },
  { name: 'Purple', hex: '#8B5CF6', bg: 'bg-purple-500' },
  { name: 'Cyan', hex: '#06B6D4', bg: 'bg-cyan-500' },
  { name: 'Pink', hex: '#EC4899', bg: 'bg-pink-500' },
  { name: 'Indigo', hex: '#6366F1', bg: 'bg-indigo-500' },
  { name: 'Slate', hex: '#64748B', bg: 'bg-slate-500' }
];

const CATEGORY_SUGGESTIONS = [
  'Client Meeting',
  'Deliverables',
  'Financial Review',
  'Tax & Compliance',
  'Milestone',
  'Engineering',
  'Audit',
  'Strategy',
  'General'
];

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialEvent,
  initialDate,
  lang
}) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const isArabic = lang === 'ar';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<EventType>('event');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [allDay, setAllDay] = useState(false);
  const [category, setCategory] = useState('General');
  const [color, setColor] = useState('#3B82F6');
  const [priority, setPriority] = useState<EventPriority>('medium');
  const [isPinned, setIsPinned] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [location, setLocation] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setShowDeleteConfirm(false);

      if (initialEvent) {
        setTitle(initialEvent.title);
        setDescription(initialEvent.description || '');
        setType(initialEvent.type || 'event');
        setStartDate(initialEvent.startDate);
        setEndDate(initialEvent.endDate || initialEvent.startDate);
        setStartTime(initialEvent.startTime || '09:00');
        setEndTime(initialEvent.endTime || '10:00');
        setAllDay(initialEvent.allDay ?? false);
        setCategory(initialEvent.category || 'General');
        setColor(initialEvent.color || '#3B82F6');
        setPriority(initialEvent.priority || 'medium');
        setIsPinned(initialEvent.isPinned ?? false);
        setIsCompleted(initialEvent.isCompleted ?? false);
        setLocation(initialEvent.location || '');
        setAssignedTo(initialEvent.assignedTo || '');
      } else {
        const defaultDate = initialDate || new Date().toISOString().split('T')[0];
        setTitle('');
        setDescription('');
        setType('event');
        setStartDate(defaultDate);
        setEndDate(defaultDate);
        setStartTime('09:00');
        setEndTime('10:00');
        setAllDay(false);
        setCategory('General');
        setColor('#3B82F6');
        setPriority('medium');
        setIsPinned(false);
        setIsCompleted(false);
        setLocation('');
        setAssignedTo('');
      }
    }
  }, [isOpen, initialEvent, initialDate]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(isArabic ? 'يرجى إدخال عنوان الفعالية أو المهمة.' : 'Please enter an event or task title.');
      return;
    }
    if (!startDate) {
      setError(isArabic ? 'يرجى تحديد تاريخ البدء.' : 'Please specify a start date.');
      return;
    }

    const payload: Omit<CalendarEvent, 'id' | 'createdAt'> | CalendarEvent = {
      ...(initialEvent ? { id: initialEvent.id, createdAt: initialEvent.createdAt } : {}),
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      startDate,
      endDate: endDate || startDate,
      startTime: allDay ? undefined : startTime,
      endTime: allDay ? undefined : endTime,
      allDay,
      category: category.trim() || 'General',
      color,
      priority,
      isPinned,
      isCompleted: type === 'task' ? isCompleted : undefined,
      location: location.trim() || undefined,
      assignedTo: assignedTo.trim() || undefined
    };

    onSave(payload);
    onClose();
  };

  const handleDelete = () => {
    if (initialEvent && onDelete) {
      onDelete(initialEvent.id);
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="bg-slate-900 border border-slate-700/80 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
              style={{ backgroundColor: `${color}20`, border: `1.5px solid ${color}` }}
            >
              <CalendarIcon className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {initialEvent ? t.editEvent : t.createEvent}
              </h2>
              <p className="text-xs text-slate-400">
                {isArabic ? 'تخصيص الفعاليات والمهام وتثبيتها في اللوحة السريعة' : 'Manage schedule, actionable deadlines, and pinned priorities'}
              </p>
            </div>
          </div>
          <button
            id="btn-close-event-modal"
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {error && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Item Type Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              {t.eventType}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['event', 'task', 'milestone', 'deadline'] as EventType[]).map((itemType) => {
                const isSelected = type === itemType;
                let label = t.eventEvent;
                if (itemType === 'task') label = t.eventTask;
                if (itemType === 'milestone') label = t.eventMilestone;
                if (itemType === 'deadline') label = t.eventDeadline;

                return (
                  <button
                    key={itemType}
                    type="button"
                    onClick={() => {
                      setType(itemType);
                      if (itemType === 'deadline') setPriority('urgent');
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition text-center cursor-pointer ${
                      isSelected 
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-sm' 
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              {t.eventTitle} <span className="text-red-400">*</span>
            </label>
            <input
              id="event-input-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.eventTitlePlaceholder}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Date & Time Row */}
          <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                {t.eventStartDate} & {t.eventEndDate}
              </span>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={allDay}
                  onChange={(e) => setAllDay(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
                />
                {t.allDay}
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">{t.eventStartDate}</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (!endDate || endDate < e.target.value) {
                      setEndDate(e.target.value);
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">{t.eventEndDate}</label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {!allDay && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-800/60">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">{t.eventStartTime}</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">{t.eventEndTime}</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Category & Priority Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                {t.eventCategory}
              </label>
              <input
                type="text"
                list="category-options"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Deliverables"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
              <datalist id="category-options">
                {CATEGORY_SUGGESTIONS.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5 text-slate-400" />
                {t.eventPriority}
              </label>
              <div className="grid grid-cols-4 gap-1 bg-slate-800/80 p-1 border border-slate-700 rounded-xl">
                {(['low', 'medium', 'high', 'urgent'] as EventPriority[]).map((p) => {
                  const isSelected = priority === p;
                  let pLabel = t.priorityLow;
                  if (p === 'medium') pLabel = t.priorityMedium;
                  if (p === 'high') pLabel = t.priorityHigh;
                  if (p === 'urgent') pLabel = t.priorityUrgent;

                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`py-1.5 text-[11px] font-semibold rounded-lg transition cursor-pointer ${
                        isSelected 
                          ? p === 'urgent' 
                            ? 'bg-red-500 text-white shadow-sm'
                            : p === 'high'
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {pLabel}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Color Accent Picker */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              {t.eventColor}
            </label>
            <div className="flex flex-wrap items-center gap-2.5">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.hex}
                  type="button"
                  onClick={() => setColor(preset.hex)}
                  title={preset.name}
                  className={`w-7 h-7 rounded-full transition-transform cursor-pointer relative flex items-center justify-center ${
                    color === preset.hex ? 'scale-125 ring-2 ring-white shadow-lg' : 'hover:scale-110 opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: preset.hex }}
                >
                  {color === preset.hex && (
                    <div className="w-2 h-2 rounded-full bg-white shadow-xs" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Meta: Location & Assignee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {t.eventLocation}
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Room, Zoom Link, Office..."
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {t.eventAssignedTo}
              </label>
              <input
                type="text"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="Team member or lead..."
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Description & Agenda */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5 text-slate-400" />
              {t.eventDescription}
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.eventDescriptionPlaceholder}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Toggles: Pin to Dashboard & Task Completed Checkbox */}
          <div className="p-4 bg-slate-800/50 border border-slate-700/60 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <div 
                onClick={() => setIsPinned(!isPinned)}
                className={`w-6 h-6 rounded-lg flex items-center justify-center transition border ${
                  isPinned 
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300' 
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-amber-400 text-amber-400' : ''}`} />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">{t.pinToDashboard}</span>
                <span className="text-[10px] text-slate-400 block">{t.pinnedItemsDesc}</span>
              </div>
            </label>

            {type === 'task' && (
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isCompleted}
                  onChange={(e) => setIsCompleted(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                />
                <span className={`text-xs font-bold ${isCompleted ? 'text-emerald-400 line-through' : 'text-slate-300'}`}>
                  {t.isCompleted}
                </span>
              </label>
            )}
          </div>

          {/* Delete confirmation section when editing */}
          {initialEvent && (
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-2 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {t.deleteEvent}
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-red-500/10 p-2 rounded-lg border border-red-500/30">
                  <span className="text-xs text-red-300">{isArabic ? 'تأكيد الحذف؟' : 'Delete item?'}</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-2.5 py-1 bg-red-600 text-white rounded text-xs font-bold hover:bg-red-700 cursor-pointer"
                  >
                    {isArabic ? 'نعم' : 'Yes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-2.5 py-1 bg-slate-700 text-slate-300 rounded text-xs font-medium hover:bg-slate-600 cursor-pointer"
                  >
                    {isArabic ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              )}
            </div>
          )}
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            {t.cancel}
          </button>
          <button
            id="btn-save-event"
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-900/40 transition cursor-pointer flex items-center gap-2"
          >
            <CheckSquare className="w-4 h-4" />
            {initialEvent ? t.saveChanges : t.addEvent}
          </button>
        </div>
      </div>
    </div>
  );
};
