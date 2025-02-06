const WMATA_HOST = "http://api.wmata.com";
const API_KEY = "2f2fc19294aa43faab04946994efb4b2";

export class WMATAClient {
  /**
   * Get routes from the WMATA API
   * @returns route information
   */
  async fetchRoutes() {
    try {
      const response = await fetch(this.#getUrl("TrainPositions/StandardRoutes", { contentType: "json" }), {
        method: "GET",
        headers: this.#getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      return response.json().then((json) => json["StandardRoutes"] || []);
    } catch (error) {
      alert(`Something went wrong: ${error}`);
    }
  }

  /**
   * Get updated train positions from the WMATA API
   * @returns train positions
   */
  async fetchTrainPositions() {
    try {
      const response = await fetch(this.#getUrl("TrainPositions/TrainPositions", { contentType: "json" }), {
        method: "GET",
        headers: this.#getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      return response.json().then((json) => json["TrainPositions"] || []);
    } catch (error) {
      alert(`Something went wrong: ${error}`);
    }
  }

  #getUrl(route, params) {
    const queryParams = new URLSearchParams(params);
    const url = `${WMATA_HOST}/${route}?${queryParams}`;

    return new URL(url);
  }

  #getHeaders() {
    return { "api_key": API_KEY };
  }
}
