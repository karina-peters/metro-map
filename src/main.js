import { TabManager } from "./utils/tabManager.js";

import { initializeDashboard } from "./views/dashboard.js";
import { initializeMap } from "./views/map.js";

const viewManager = new TabManager([
  {
    buttonId: "map-tab",
    contentId: "map-content",
    shouldRefresh: false,
  },
  {
    buttonId: "list-tab",
    contentId: "list-content",
    shouldRefresh: false,
  },
]);

// Initialize views
await initializeMap();
await initializeDashboard();
await viewManager.init();
