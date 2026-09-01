// Define global window interface for TypeScript
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
  const driverFactory = window.driver?.js?.driver || window.driver;

  if (!driverFactory) {
    console.warn("Driver.js CDN script has not loaded yet.");
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
