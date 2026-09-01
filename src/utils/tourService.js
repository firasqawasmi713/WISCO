import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export const startAnimatedTour = () => {
  const driverObj = driver({
    animate: true,
    duration: 350, // Transition speed between highlights (ms)
    smoothScroll: true, // Smoothly scrolls the page to the target widget
    overlayColor: "rgba(5, 11, 24, 0.75)", // Deep dimming backdrop
    overlayOpacity: 0.8,
    stagePadding: 8, // Padding around the highlighted element
    stageRadius: 12, // Matches rounded card borders
    showProgress: true,
    allowClose: true,
    steps: [
      {
        element: "#wisco-banner",
        popover: {
          title: "Welcome to WISCO ✨",
          description: "Let's take a quick 30-second tour of your financial and project suite.",
          side: "bottom",
          align: "start",
          popoverClass: "animated-tour-popover",
        },
      },
      {
        element: "#wisco-kpis",
        popover: {
          title: "Real-time Margins 📊",
          description: "Monitor live balances, spendings, overheads, and automatic profit calculations.",
          side: "top",
          align: "center",
          popoverClass: "animated-tour-popover",
        },
      },
      {
        element: "#nav-events-tab",
        popover: {
          title: "Events & Deadlines 📅",
          description: "Schedule client meetings and pin critical tasks directly to your priority dashboard.",
          side: "right",
          align: "center",
          popoverClass: "animated-tour-popover",
        },
      },
    ],
  });

  driverObj.drive();
};
