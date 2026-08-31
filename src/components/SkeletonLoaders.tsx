import React from 'react';

/**
 * Reusable animated shimmer/pulse placeholder item
 */
export const SkeletonBox: React.FC<{
  className?: string;
  rounded?: string;
}> = ({ className = 'h-4 w-full', rounded = 'rounded-lg' }) => {
  return (
    <div
      className={`bg-slate-200/80 dark:bg-slate-700/60 animate-pulse ${rounded} ${className}`}
    />
  );
};

/**
 * A. Top KPI Financial Cards (4 Cards Grid)
 * Top label: Skeleton pill (h-3 w-24)
 * Big Metric Value: Wide bold skeleton bar (h-8 w-32)
 * Bottom Subtext/Trend: Compact badge skeleton (h-3 w-20)
 */
export const KpiCardsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5" id="kpi-cards-skeleton">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`p-6 rounded-2xl border transition-all ${
            i === 4
              ? 'bg-[#0F284E]/90 dark:bg-[#071326] border-slate-800'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
          }`}
        >
          {/* Top label pill */}
          <div className="mb-3">
            <SkeletonBox
              className={`h-3 w-24 ${
                i === 4 ? 'bg-white/20 dark:bg-slate-700/60' : ''
              }`}
              rounded="rounded-full"
            />
          </div>

          {/* Big Metric Value */}
          <div className="my-2">
            <SkeletonBox
              className={`h-8 w-36 sm:w-40 ${
                i === 4 ? 'bg-sky-400/30 dark:bg-sky-500/20' : ''
              }`}
              rounded="rounded-lg"
            />
          </div>

          {/* Bottom Subtext / Trend */}
          <div className="mt-3">
            <SkeletonBox
              className={`h-3 w-28 ${
                i === 4 ? 'bg-white/20 dark:bg-slate-700/60' : ''
              }`}
              rounded="rounded-full"
            />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * B. Revenue vs. Expenses Chart Widget Skeleton
 * Header & Legend: Two small placeholder rectangles
 * Body: Silhouette of 5-6 vertical bars with alternating heights (h-32, h-48, h-28, etc.)
 */
export const RevenueExpensesChartSkeleton: React.FC = () => {
  return (
    <div
      id="dash-chart-revenue-expenses-skeleton"
      className="spotlight-card lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between"
    >
      {/* Header & Legend placeholder */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <SkeletonBox className="h-5 w-44" rounded="rounded-md" />
        <div className="flex items-center gap-3">
          <SkeletonBox className="h-4 w-20" rounded="rounded-full" />
          <SkeletonBox className="h-4 w-20" rounded="rounded-full" />
        </div>
      </div>

      {/* Chart Body Bar Silhouette */}
      <div className="h-64 sm:h-72 w-full flex items-end justify-between gap-3 sm:gap-6 px-4 pb-4 pt-8 bg-slate-50/50 dark:bg-[#101F3C]/30 rounded-2xl border border-slate-100 dark:border-slate-800/60">
        {[
          { rev: 'h-40', exp: 'h-24' },
          { rev: 'h-52', exp: 'h-36' },
          { rev: 'h-32', exp: 'h-20' },
          { rev: 'h-48', exp: 'h-32' },
          { rev: 'h-60', exp: 'h-44' },
          { rev: 'h-36', exp: 'h-28' },
        ].map((pair, idx) => (
          <div key={idx} className="flex-1 flex items-end justify-center gap-1.5 h-full">
            <div
              className={`w-full max-w-[20px] ${pair.rev} bg-blue-400/40 dark:bg-blue-600/30 animate-pulse rounded-t-md`}
            />
            <div
              className={`w-full max-w-[20px] ${pair.exp} bg-sky-300/40 dark:bg-sky-400/25 animate-pulse rounded-t-md`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Project Breakdown Doughnut Chart Skeleton
 */
export const ProjectBreakdownChartSkeleton: React.FC = () => {
  return (
    <div
      id="dash-chart-project-breakdown-skeleton"
      className="spotlight-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <SkeletonBox className="w-8 h-8" rounded="rounded-xl" />
          <SkeletonBox className="h-4 w-32" rounded="rounded-md" />
        </div>
      </div>

      <div className="h-56 sm:h-64 w-full flex items-center justify-center my-auto">
        <div className="w-40 h-40 rounded-full border-8 border-slate-200/80 dark:border-slate-700/60 border-t-blue-500/40 dark:border-t-blue-500/50 animate-pulse flex items-center justify-center">
          <SkeletonBox className="w-16 h-16" rounded="rounded-full" />
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-center">
        <SkeletonBox className="h-3 w-36" rounded="rounded-full" />
      </div>
    </div>
  );
};

/**
 * D. Upcoming Schedule / Overview List Skeleton (4 stacked rows)
 * Left: Mini square date badge (h-10 w-10 rounded-lg)
 * Center: Two text lines (Event title h-4 w-40, category subtitle h-3 w-24)
 * Right: Action/Pin placeholder chip (h-4 w-12 rounded-full)
 */
export const UpcomingScheduleSkeleton: React.FC = () => {
  return (
    <div
      id="dash-upcoming-schedule-skeleton"
      className="spotlight-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <SkeletonBox className="w-8 h-8" rounded="rounded-xl" />
            <SkeletonBox className="h-5 w-36" rounded="rounded-md" />
          </div>
          <SkeletonBox className="h-4 w-20" rounded="rounded-full" />
        </div>

        {/* 4 Stacked Rows */}
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-800/40 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 overflow-hidden min-w-0 flex-1">
                {/* Left Mini square date/status badge */}
                <SkeletonBox className="w-10 h-10 shrink-0" rounded="rounded-lg" />

                {/* Center Title + Subtitle */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <SkeletonBox className="h-4 w-3/4 max-w-[160px]" rounded="rounded-md" />
                  <SkeletonBox className="h-3 w-1/2 max-w-[100px]" rounded="rounded-full" />
                </div>
              </div>

              {/* Right Action / Pin placeholder chip */}
              <div className="shrink-0">
                <SkeletonBox className="h-6 w-20" rounded="rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Button Skeleton */}
      <div className="mt-6">
        <SkeletonBox className="h-10 w-full" rounded="rounded-xl" />
      </div>
    </div>
  );
};

/**
 * Feed List Card Skeleton (Clients / Spendings Feed in Dashboard)
 */
export const OperationalFeedSkeleton: React.FC<{
  titleWidth?: string;
}> = ({ titleWidth = 'w-32' }) => {
  return (
    <div className="spotlight-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <SkeletonBox className="w-8 h-8" rounded="rounded-xl" />
            <SkeletonBox className={`h-5 ${titleWidth}`} rounded="rounded-md" />
          </div>
          <SkeletonBox className="h-4 w-16" rounded="rounded-full" />
        </div>

        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-800/40 flex items-center justify-between gap-3"
            >
              <div className="flex items-center space-x-3 rtl:space-x-reverse min-w-0 flex-1">
                <SkeletonBox className="w-9 h-9 shrink-0" rounded="rounded-xl" />
                <div className="space-y-1 flex-1 min-w-0">
                  <SkeletonBox className="h-3.5 w-3/4 max-w-[140px]" rounded="rounded-md" />
                  <SkeletonBox className="h-2.5 w-1/2 max-w-[90px]" rounded="rounded-full" />
                </div>
              </div>
              <SkeletonBox className="h-4 w-16 shrink-0" rounded="rounded-md" />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <SkeletonBox className="h-10 w-full" rounded="rounded-xl" />
      </div>
    </div>
  );
};

/**
 * C. Events Calendar View Skeleton
 * Header controls: Skeleton blocks for Month selector, view toggle buttons, and "+ Add Event"
 * Calendar Grid: 7x5 cell grid where each day cell shows a small skeleton date number in corner and 1-2 placeholder event pills
 * Pinned Priorities Sidebar: 3 stacked skeleton cards with badge, title, and date placeholders
 */
export const EventsCalendarSkeleton: React.FC = () => {
  return (
    <div className="space-y-6" id="events-calendar-skeleton">
      {/* Top Banner & Control Bar Skeleton */}
      <div className="bg-white dark:bg-[#0B1528] border border-slate-200 dark:border-blue-500/20 rounded-3xl p-6 sm:p-8 shadow-[0_4px_25px_rgba(0,0,0,0.06)] dark:shadow-[0_0_20px_rgba(59,130,246,0.15)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Header title */}
          <div className="flex items-center gap-3">
            <SkeletonBox className="w-10 h-10" rounded="rounded-2xl" />
            <div className="space-y-1.5">
              <SkeletonBox className="h-6 w-48" rounded="rounded-lg" />
              <SkeletonBox className="h-3 w-32" rounded="rounded-full" />
            </div>
          </div>

          {/* Action buttons & View mode toggles */}
          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Pills */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-[#101F3C] rounded-2xl border border-slate-200 dark:border-slate-700/60 gap-1">
              <SkeletonBox className="h-7 w-16" rounded="rounded-xl" />
              <SkeletonBox className="h-7 w-16" rounded="rounded-xl" />
              <SkeletonBox className="h-7 w-16" rounded="rounded-xl" />
            </div>

            {/* + Add Event Button */}
            <SkeletonBox className="h-10 w-28" rounded="rounded-2xl" />
          </div>
        </div>

        {/* Date Navigation & Search Sub-bar */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <SkeletonBox className="w-8 h-8" rounded="rounded-xl" />
            <SkeletonBox className="h-8 w-16" rounded="rounded-xl" />
            <SkeletonBox className="w-8 h-8" rounded="rounded-xl" />
            <SkeletonBox className="h-5 w-36 ml-2" rounded="rounded-md" />
          </div>
          <div className="flex items-center gap-2.5">
            <SkeletonBox className="h-8 w-48" rounded="rounded-xl" />
            <SkeletonBox className="h-8 w-24" rounded="rounded-xl" />
          </div>
        </div>
      </div>

      {/* Main Content Layout (7x5 Calendar Grid + Pinned Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Main Calendar View (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-[#0B1528] border border-slate-200 dark:border-blue-500/20 rounded-3xl p-4 sm:p-6 shadow-[0_4px_25px_rgba(0,0,0,0.06)] dark:shadow-[0_0_20px_rgba(59,130,246,0.15)] flex flex-col justify-between">
          <div className="space-y-2">
            {/* Day of week headers */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <div key={d} className="py-2 flex justify-center">
                  <SkeletonBox className="h-3 w-8" rounded="rounded-full" />
                </div>
              ))}
            </div>

            {/* 7x5 Cell Grid (35 days) */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {Array.from({ length: 35 }).map((_, idx) => (
                <div
                  key={idx}
                  className="min-h-[85px] sm:min-h-[105px] p-2 rounded-2xl border border-slate-200/70 dark:border-slate-800/60 bg-slate-50/50 dark:bg-[#101F3C]/40 flex flex-col justify-between"
                >
                  {/* Corner date number */}
                  <div className="flex justify-between items-start">
                    <SkeletonBox className="w-5 h-4" rounded="rounded-md" />
                    {idx % 4 === 0 && (
                      <SkeletonBox className="w-1.5 h-1.5" rounded="rounded-full" />
                    )}
                  </div>

                  {/* 1-2 placeholder event pills */}
                  <div className="space-y-1 mt-2">
                    {idx % 2 === 0 && (
                      <SkeletonBox
                        className="h-3 w-full bg-blue-300/40 dark:bg-blue-600/30"
                        rounded="rounded-md"
                      />
                    )}
                    {idx % 3 === 0 && (
                      <SkeletonBox
                        className="h-3 w-3/4 bg-purple-300/40 dark:bg-purple-600/30"
                        rounded="rounded-md"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pinned Priorities Sidebar (4 cols) with 3 stacked skeleton cards */}
        <div className="hidden lg:flex lg:col-span-4 h-full flex-col">
          <div className="bg-white dark:bg-[#0B1528] border border-slate-200 dark:border-blue-500/20 rounded-3xl p-5 shadow-[0_4px_25px_rgba(0,0,0,0.06)] dark:shadow-[0_0_20px_rgba(59,130,246,0.15)] flex flex-col h-full">
            {/* Header */}
            <div className="pb-4 border-b border-slate-200 dark:border-slate-800/80 mb-4 shrink-0">
              <SkeletonBox className="h-4 w-32 mb-1.5" rounded="rounded-md" />
              <SkeletonBox className="h-3 w-48" rounded="rounded-full" />
            </div>

            {/* 3 Stacked Cards */}
            <div className="space-y-3 flex-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-700/60 bg-slate-50/70 dark:bg-[#101F3C]/50 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1.5 flex-1">
                      <SkeletonBox className="h-3 w-16" rounded="rounded" />
                      <SkeletonBox className="h-4 w-3/4" rounded="rounded-md" />
                    </div>
                    <SkeletonBox className="w-5 h-5" rounded="rounded-lg" />
                  </div>

                  <SkeletonBox className="h-3 w-full" rounded="rounded-full" />
                  <SkeletonBox className="h-3 w-2/3" rounded="rounded-full" />

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/40">
                    <SkeletonBox className="h-3 w-20" rounded="rounded-full" />
                    <SkeletonBox className="h-5 w-14" rounded="rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Generic Table List View Skeleton (for Invoices, Clients, Spendings)
 */
export const TableListSkeleton: React.FC<{
  headersCount?: number;
  rowsCount?: number;
}> = ({ headersCount = 5, rowsCount = 6 }) => {
  return (
    <div className="space-y-6" id="table-list-skeleton">
      {/* Top Controls & Metrics */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <SkeletonBox className="w-10 h-10" rounded="rounded-xl" />
            <div className="space-y-1">
              <SkeletonBox className="h-5 w-36" rounded="rounded-md" />
              <SkeletonBox className="h-3 w-48" rounded="rounded-full" />
            </div>
          </div>
          <SkeletonBox className="h-10 w-32" rounded="rounded-xl" />
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-1">
              <SkeletonBox className="h-3 w-20" rounded="rounded-full" />
              <SkeletonBox className="h-6 w-28" rounded="rounded-md" />
            </div>
          ))}
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden p-4 sm:p-6">
        {/* Search / filter bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
          <SkeletonBox className="h-9 w-64" rounded="rounded-xl" />
          <div className="flex gap-2">
            <SkeletonBox className="h-9 w-24" rounded="rounded-xl" />
            <SkeletonBox className="h-9 w-24" rounded="rounded-xl" />
          </div>
        </div>

        {/* Table Rows */}
        <div className="space-y-2">
          {Array.from({ length: rowsCount }).map((_, i) => (
            <div
              key={i}
              className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-800/40 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <SkeletonBox className="w-8 h-8 shrink-0" rounded="rounded-xl" />
                <div className="space-y-1 flex-1">
                  <SkeletonBox className="h-4 w-40" rounded="rounded-md" />
                  <SkeletonBox className="h-3 w-24" rounded="rounded-full" />
                </div>
              </div>
              <SkeletonBox className="h-4 w-24 shrink-0" rounded="rounded-md" />
              <SkeletonBox className="h-6 w-16 shrink-0" rounded="rounded-full" />
              <SkeletonBox className="h-8 w-8 shrink-0" rounded="rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
