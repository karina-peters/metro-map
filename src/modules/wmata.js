const WMATA_HOST = "http://api.wmata.com";
const API_KEY = "2f2fc19294aa43faab04946994efb4b2";

/**
 * Get routes from the WMATA API
 * @returns route information
 */
export async function fetchRoutes() {
  try {
    const response = await fetch(getUrl("TrainPositions/StandardRoutes", { contentType: "json" }), {
      method: "GET",
      headers: getHeaders(),
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
export async function fetchTrainPositions() {
  try {
    const response = await fetch(getUrl("TrainPositions/TrainPositions", { contentType: "json" }), {
      method: "GET",
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    return response.json().then((json) => json["TrainPositions"] || []);
  } catch (error) {
    alert(`Something went wrong: ${error}`);
  }
}

function getUrl(route, params) {
  const queryParams = new URLSearchParams(params);
  const url = `${WMATA_HOST}/${route}?${queryParams}`;

  return new URL(url);
}

function getHeaders() {
  return { "api_key": API_KEY };
}
