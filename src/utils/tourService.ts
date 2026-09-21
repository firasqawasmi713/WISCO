import { driver as bundledDriver } from "driver.js";
import "driver.js/dist/driver.css";

// Declare global window interface for Driver CDN fallback if present
declare global {
  interface Window {
    driver?: {
      js?: {
        driver: (config?: any) => any;
      };
      driver?: (config?: any) => any;
    };
  }
}

export const startAnimatedTour = () => {
  // Prefer bundled driver, fallback to global window.driver if needed
  let driverFactory: ((config?: any) => any) | null = null;

  if (typeof bundledDriver === 'function') {
    driverFactory = bundledDriver;
  } else if (typeof window.driver?.js?.driver === 'function') {
    driverFactory = window.driver.js.driver;
  } else if (typeof window.driver?.driver === 'function') {
    driverFactory = window.driver.driver;
  } else if (typeof (window as any).driver === 'function') {
    driverFactory = (window as any).driver;
  }

  if (!driverFactory) {
    console.warn("Driver.js is not available.");
    return;
  }

  const steps = [
    {
      element: "#wisco-banner",
      popover: {
        title: '<span style="color: #ffffff; font-weight: 700; font-size: 15px;">Welcome to WISCO ✨</span>',
        description: '<span style="color: #e2e8f0; font-size: 13px; line-height: 1.5; display: inline-block;">Your central dashboard for project tracking, revenue, and cash flow.</span>',
        side: "bottom",
        align: "start",
        popoverClass: "animated-tour-popover",
      },
    },
    {
      element: "#wisco-kpis",
      popover: {
        title: '<span style="color: #ffffff; font-weight: 700; font-size: 15px;">Key Financial Metrics 📊</span>',
        description: '<span style="color: #e2e8f0; font-size: 13px; line-height: 1.5; display: inline-block;">Track gross revenue, direct spendings, overhead, and net profit margins in real time.</span>',
        side: "top",
        align: "center",
        popoverClass: "animated-tour-popover",
      },
    },
    {
      element: "#dash-latest-clients-card",
      popover: {
        title: '<span style="color: #ffffff; font-weight: 700; font-size: 15px;">Client Management 👥</span>',
        description: '<span style="color: #e2e8f0; font-size: 13px; line-height: 1.5; display: inline-block;">Manage contracts, log deliverables, and monitor live client pipelines.</span>',
        side: "top",
        align: "start",
        popoverClass: "animated-tour-popover",
      },
    },
    {
      element: "#dash-recent-activity-card",
      popover: {
        title: '<span style="color: #ffffff; font-weight: 700; font-size: 15px;">Expenses & Activity 💳</span>',
        description: '<span style="color: #e2e8f0; font-size: 13px; line-height: 1.5; display: inline-block;">Keep track of all direct operational spendings and invoices.</span>',
        side: "top",
        align: "start",
        popoverClass: "animated-tour-popover",
      },
    }
  ];

  // Filter out any step targets not present in DOM
  const validSteps = steps.filter(step => document.querySelector(step.element));
  if (validSteps.length === 0) return;

  const driverObj = driverFactory({
    animate: true,
    smoothScroll: true,
    overlayColor: "rgba(5, 11, 24, 0.75)",
    overlayOpacity: 0.8,
    stagePadding: 8,
    stageRadius: 12,
    showProgress: true,
    allowClose: true,
    steps: validSteps,
    onPopoverRendered: (popover: any) => {
      // Direct DOM safety net to enforce high-contrast readable colors
      const popoverWrapper = popover?.wrapper as HTMLElement | undefined;
      if (!popoverWrapper) return;

      popoverWrapper.style.backgroundColor = '#0d1a33';
      popoverWrapper.style.color = '#ffffff';
      popoverWrapper.style.border = '1px solid rgba(59, 130, 246, 0.4)';
      popoverWrapper.style.borderRadius = '16px';
      popoverWrapper.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 0 20px rgba(59, 130, 246, 0.25)';

      const title = popoverWrapper.querySelector('.driver-popover-title') as HTMLElement | null;
      if (title) {
        title.style.color = '#ffffff';
        title.style.fontWeight = '700';
      }

      const desc = popoverWrapper.querySelector('.driver-popover-description') as HTMLElement | null;
      if (desc) {
        desc.style.color = '#e2e8f0';
      }

      const progress = popoverWrapper.querySelector('.driver-popover-progress-text') as HTMLElement | null;
      if (progress) {
        progress.style.color = '#94a3b8';
      }

      const prevBtn = popoverWrapper.querySelector('.driver-popover-prev-btn') as HTMLElement | null;
      if (prevBtn) {
        prevBtn.style.color = '#cbd5e1';
        prevBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
        prevBtn.style.border = '1px solid rgba(255, 255, 255, 0.15)';
      }

      const nextBtn = popoverWrapper.querySelector('.driver-popover-next-btn') as HTMLElement | null;
      if (nextBtn) {
        nextBtn.style.color = '#ffffff';
        nextBtn.style.backgroundColor = '#2563eb';
      }
    }
  });

  driverObj.drive();
};
