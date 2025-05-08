import express from "express";
import fetch from "node-fetch";
import path from "path";
import bodyParser from "body-parser";
import cors from "cors";

import { configDotenv } from "dotenv";
import { fileURLToPath } from 'url';

import { getHeaders, getUrl, Response } from "./utils.js";
import { preloadData, lineToCktList, lineToRegSeqMap } from "./cache.js";

import regionData from "./data/regions.json" with { type: "json" };
import stationData from "./data/stations.json" with { type: "json" };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
configDotenv({ path: path.resolve(__dirname, ".env") });

const app = express();
const port = process.env.PORT || 3000;

// Parse request.body and make it available
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

app.use(cors({ origin: "*" }));

// Fetching static data files
app.get("/api/regions/:region", async (req, res) => {
  console.log("fetching regions...");

  try {
    let region = req.params.region || "All";
    const data = regionData.find((r) => r.Id === region);

    if (!data) {
      throw new Error("provided region is not defined");
    }

    return Response.OK(res, data);
  } catch (error) {
    return Response.Error(res, 500, error.message);
  }
});

app.get("/api/stations", async (req, res) => {
  console.log("fetching stations...");

  try {
    if (!stationData) {
      throw new Error("data is null or empty");
    }

    const data = stationData.map(s => ({ code: s.Code, name: s.Name }));
    return Response.OK(res, data);
  } catch (error) {
    return Response.Error(res, 500, error.message);
  }
});

// WMATA API wrapper
app.get("/api/routes", async (req, res) => {
  console.log("fetching routes...");

  try {
    const response = await fetch(getUrl("TrainPositions/StandardRoutes", { contentType: "json" }), {
      method: "GET",
      headers: getHeaders(),
    });

    const routes = await response.json().then((json) => json["StandardRoutes"] || []);
    if (!routes || routes.length === 0) {
      throw new Error("Route information is missing or empty");
    }

    return Response.OK(res, routes);
  } catch (error) {
    return Response.Error(res, 500, error.message);
  }
});

app.get("/api/trains", async (req, res) => {
  console.log("fetching trains...");

  try {
    const response = await fetch(getUrl("TrainPositions/TrainPositions", { contentType: "json" }), {
      method: "GET",
      headers: getHeaders(),
    });

    const data = await response.json().then((json) => json["TrainPositions"] || []);
    if (!data || data.length === 0) {
      throw new Error("data is null or empty");
    }

    return Response.OK(res, data);
  } catch (error) {
    return Response.Error(res, 500, error.message);
  }
});


app.get("/api/arrivals/:station", async (req, res) => {
  console.log("fetching arrivals...");

  try {
    const response = await fetch(getUrl(`StationPrediction.svc/json/GetPrediction/${req.params.station}`, { contentType: "json" }), {
      method: "GET",
      headers: getHeaders(),
    });

    const data = await response.json().then((json) => json["Trains"] || []);
    if (!data || data.length === 0) {
      throw new Error("data is null or empty");
    }

    return Response.OK(res, data);
  } catch (error) {
    return Response.Error(res, 500, error.message);
  }
});

// TODO: maybe add another static data file for lines? Need to return some more data
app.get("/api/lines", async (req, res) => {
  console.log("fetching lines...");

  try {
    const data = Array.from(lineToCktList.keys());

    return Response.OK(res, data);
  } catch (error) {
    return Response.Error(res, 500, error.message);
  }
});

app.get("/api/circuits", async (req, res) => {
  console.log(`fetching circuits for reg:${req.query.regionId}...`);

  try {
    const lineId = req.query.lineId;
    const regionId = req.query.regionId || "All";

    if (lineId && !lineToCktList.has(lineId)) {
      return Response.Error(res, 404, "Line not found");
    }

    const lineIdList = Array.from(lineId || lineToCktList.keys());
    const data = lineIdList.map((i) => {
      let circuits = lineToCktList.get(i);
      if (regionId) {
        const regBounds = lineToRegSeqMap.get(regionId)?.get(i);
        circuits = circuits.slice(regBounds.origin, regBounds.terminus);
      }

      return { lineId: i, regionId: regionId, circuits: circuits };
    });

    return Response.OK(res, data);
  } catch (error) {
    return Response.Error(res, 500, error.message);
  }
});

// listen for requests :)
const listener = app.listen(port, async () => {
  await preloadData();
  console.log("Your app is listening on port " + listener.address().port);
});
