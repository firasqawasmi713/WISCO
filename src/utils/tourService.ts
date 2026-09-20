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
        title: "Welcome to WISCO ✨",
        description: "Your central dashboard for project tracking, revenue, and cash flow.",
        side: "bottom",
        align: "start",
        popoverClass: "animated-tour-popover",
      },
    },
    {
      element: "#wisco-kpis",
      popover: {
        title: "Key Financial Metrics 📊",
        description: "Track gross revenue, direct spendings, overhead, and net profit margins in real time.",
        side: "top",
        align: "center",
        popoverClass: "animated-tour-popover",
      },
    },
    {
      element: "#dash-latest-clients-card",
      popover: {
        title: "Client Management 👥",
        description: "Manage contracts, log deliverables, and monitor live client pipelines.",
        side: "top",
        align: "start",
        popoverClass: "animated-tour-popover",
      },
    },
    {
      element: "#dash-recent-activity-card",
      popover: {
        title: "Expenses & Activity 💳",
        description: "Keep track of all direct operational spendings and invoices.",
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
  });

  driverObj.drive();
};
