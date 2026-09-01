import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  BarChart2, 
  PlusCircle, 
  DollarSign, 
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { LanguageCode } from '../types';

export interface TourStep {
  targetId: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  icon: React.ReactNode;
}

const TOUR_STEPS: TourStep[] = [
  {
    targetId: 'dashboard-view-root',
    titleEn: 'Welcome to WISCO Financial Suite',
    titleAr: 'مرحباً بك في منصة ويسكو المالية',
    descriptionEn: 'Your centralized system for tracking client contracts, direct expenditures, automated invoices, and project timelines with real-time Supabase sync.',
    descriptionAr: 'نظامك المركزي لمتابعة عقود العملاء، والمصاريف المباشرة، والفواتير التلقائية، وجداول المواعيد مع مزامنة Supabase الفورية.',
    icon: <Sparkles className="w-5 h-5 text-amber-500" />
  },
  {
    targetId: 'kpi-card-total-revenue',
    titleEn: 'Real-Time Financial KPIs & Profit',
    titleAr: 'المؤشرات المالية وصافي الأرباح الفعلي',
    descriptionEn: 'Instantly view your total gross contract revenue, logged supplier expenses, deliverable overhead, and dynamic net profit margins.',
    descriptionAr: 'اطّلع فوراً على إجمالي إيرادات العقود، ومصاريف الموردين المسجلة، وتكاليف التشغيل، وصافي هوامش الربح التفاعلية.',
    icon: <DollarSign className="w-5 h-5 text-emerald-500" />
  },
  {
    targetId: 'dash-chart-revenue-expenses-card',
    titleEn: 'Visual Analytics & Breakdown',
    titleAr: 'التحليلات البيانية وتوزيع المشاريع',
    descriptionEn: 'Interactive month-by-month financial comparisons against overheads, alongside category breakdown doughnut charts.',
    descriptionAr: 'مقارنات بيانية تفاعلية شهرية للإيرادات مقابل النفقات التشغيلية، مع مخطط دائري لتوزيع مشاريع العملاء حسب المجال.',
    icon: <BarChart2 className="w-5 h-5 text-sky-500" />
  },
  {
    targetId: 'dash-btn-add-client',
    titleEn: 'Quick Action Hub',
    titleAr: 'مركز الإجراءات السريعة',
    descriptionEn: 'Onboard new client project scopes, record direct expenditures, or manually refresh data from Supabase with a single click.',
    descriptionAr: 'أضف مشاريع جديدة للعملاء، وسجّل المصاريف المباشرة، أو حدّث البيانات مع قاعدة بيانات Supabase بنقرة واحدة.',
    icon: <PlusCircle className="w-5 h-5 text-blue-500" />
  },
  {
    targetId: 'dash-latest-clients-card',
    titleEn: 'Operational Feeds & Schedule',
    titleAr: 'العمليات وجداول الفعاليات والمواعيد',
    descriptionEn: 'Track your latest clients, recent expenditures, and stay ahead of upcoming milestone deadlines directly from the calendar feed.',
    descriptionAr: 'تابع أحدث عقود العملاء وسجلات المصاريف، وابقَ على اطلاع بالمواعيد النهائية وأولويات التسليم من خلال جدول التقويم.',
    icon: <Calendar className="w-5 h-5 text-purple-500" />
  }
];

interface DashboardTourProps {
  isOpen: boolean;
  onClose: () => void;
  lang: LanguageCode;
}

export const DashboardTour: React.FC<DashboardTourProps> = ({
  isOpen,
  onClose,
  lang
}) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const isArabic = lang === 'ar';

  const step = TOUR_STEPS[currentStepIdx] || TOUR_STEPS[0];
  const totalSteps = TOUR_STEPS.length;
  const isLastStep = currentStepIdx === totalSteps - 1;

  useEffect(() => {
    if (!isOpen) return;

    // Scroll active element into view if target element exists
    const targetElem = document.getElementById(step.targetId);
    if (targetElem) {
      targetElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      targetElem.classList.add('ring-4', 'ring-blue-500/50', 'transition-all', 'duration-300');
    }

    return () => {
      if (targetElem) {
        targetElem.classList.remove('ring-4', 'ring-blue-500/50');
      }
    };
  }, [isOpen, currentStepIdx, step.targetId]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStepIdx(prev => Math.min(prev + 1, totalSteps - 1));
    }
  };

  const handlePrev = () => {
    setCurrentStepIdx(prev => Math.max(prev - 1, 0));
  };

  const handleComplete = () => {
    localStorage.setItem('wisco_tour_seen', 'true');
    onClose();
  };

  const handleSkip = () => {
    localStorage.setItem('wisco_tour_seen', 'true');
    onClose();
  };

  return (
    <div 
      id="wisco-dashboard-tour-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-step-title"
    >
      <div 
        id="wisco-tour-card"
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden transform transition-all duration-300 scale-100"
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-[#0F284E] via-[#1E3A8A] to-[#2563EB] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-white/10 backdrop-blur-md">
              {step.icon}
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-sky-200 font-bold">
                {isArabic ? `الجولة التعريفية • الخطوة ${currentStepIdx + 1} من ${totalSteps}` : `Product Tour • Step ${currentStepIdx + 1} of ${totalSteps}`}
              </p>
              <h3 id="tour-step-title" className="text-base sm:text-lg font-bold text-white leading-tight">
                {isArabic ? step.titleAr : step.titleEn}
              </h3>
            </div>
          </div>

          <button
            id="btn-tour-close"
            type="button"
            onClick={handleSkip}
            className="text-sky-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title={isArabic ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
            {isArabic ? step.descriptionAr : step.descriptionEn}
          </p>

          {/* Progress Indicators */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1.5">
              {TOUR_STEPS.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentStepIdx(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    idx === currentStepIdx 
                      ? 'w-6 bg-blue-600 dark:bg-sky-400' 
                      : 'w-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'
                  }`}
                  title={isArabic ? `الخطوة ${idx + 1}` : `Step ${idx + 1}`}
                />
              ))}
            </div>

            <button
              id="btn-tour-skip-link"
              type="button"
              onClick={handleSkip}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
            >
              {isArabic ? 'تخطي الجولة' : 'Skip tour'}
            </button>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              id="btn-tour-prev"
              type="button"
              onClick={handlePrev}
              disabled={currentStepIdx === 0}
              className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer ${
                currentStepIdx === 0 
                  ? 'opacity-40 cursor-not-allowed text-slate-400 dark:text-slate-600' 
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
              <span>{isArabic ? 'السابق' : 'Previous'}</span>
            </button>

            <button
              id="btn-tour-next"
              type="button"
              onClick={handleNext}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>{isLastStep ? (isArabic ? 'إنهاء واستكشاف' : 'Finish & Explore') : (isArabic ? 'التالي' : 'Next')}</span>
              {isLastStep ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4 rtl:rotate-180" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
