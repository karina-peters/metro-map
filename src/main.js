import { TabManager } from "./utils/tabManager.js";

import { Dashboard } from "./views/dashboard.js";
import { MetroMap } from "./views/map.js";

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

const map = new MetroMap();
const dashboard = new Dashboard();

// Initialize views
await map.init();
await dashboard.init();
await viewManager.init();
