export class TabManager {
  #tabs;
  #refreshIntervalId;
  #activeIndex;

  /**
   * Initializes a new instance of TabManager
   * @param {Array} tabs - An array of tab objects, containing a required buttonId and contentId, and optional loadData, shouldRefresh, and refreshRate properties
   */
  constructor(tabs) {
    this.#tabs = tabs;
    this.#refreshIntervalId = -1;
    this.#activeIndex = 0;
  }

  /**
   * Initializes the tab system by pre-loading content and setting up event listeners.
   */
  async init() {
    for (const [index, tab] of this.#tabs.entries()) {
      const button = document.querySelector(`#${tab.buttonId}`);
      const content = document.querySelector(`#${tab.contentId}`);

      // Pre-load the data for this section if a loadData function is provided
      if (tab.loadData) {
        await tab.loadData(content);
      }

      // Set up a click handler for this tab's activation button
      button.addEventListener("click", () => {
        this.#cancelInterval();

        // Refresh content if requested
        if (tab.shouldRefresh) {
          this.refreshContent(index);
        }

        this.#activateTab(index);
      });
    }
  }

  /**
   * Refreshes the content of the provided tab
   * If the tab has a refreshRate defined, an interval is reset
   * @param {number} [index=this.#activeIndex] - The index of the tab to refresh.
   */
  refreshContent(index = this.#activeIndex) {
    const tab = this.#tabs[index];
    const container = document.querySelector(`#${tab.contentId}`);

    // Perform an immediate refresh
    setTimeout(async () => await tab.loadData(container));

    // Set up periodic refresh if requested
    if (tab.refreshRate) {
      this.#cancelInterval();
      this.#refreshIntervalId = setInterval(async () => await tab.loadData(container), tab.refreshRate);
    }
  }

  /**
   * Activates a tab, updating the UI to reflect the active state
   * @param {number} index - The index of the tab to activate
   */
  #activateTab(index) {
    const { buttonId: activeBtnId, contentId: activeConId } = this.#tabs[this.#activeIndex] || {};
    const { buttonId: newBtnId, contentId: newConId } = this.#tabs[index];

    const activeButton = document.querySelector(`#${activeBtnId}`);
    const activeContent = document.querySelector(`#${activeConId}`);
    const newButton = document.querySelector(`#${newBtnId}`);
    const newContent = document.querySelector(`#${newConId}`);

    // Update button and content states
    activeButton?.classList.remove("active");
    newButton.classList.add("active");
    activeContent?.classList.add("hidden");
    newContent.classList.remove("hidden");

    this.#activeIndex = index;
  }

  /**
   * Cancels any ongoing refresh interval to prevent multiple intervals from running simultaneously
   */
  #cancelInterval() {
    if (this.#refreshIntervalId !== -1) {
      clearInterval(this.#refreshIntervalId);
    }
  }
}
