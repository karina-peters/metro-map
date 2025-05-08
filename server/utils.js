export const getHeaders = () => {
  return { "api_key": process.env.WMATA_API_KEY };
};

export const getUrl = (route, params) => {
  const queryParams = new URLSearchParams(params);
  const url = `${process.env.WMATA_HOST}/${route}?${queryParams}`;

  return new URL(url);
};

export const getLineId = (lineCode, dirCode) => {
  return `${lineCode}-${dirCode}`;
};

export const Response = {
  OK: (res, data, message = "data sent successfully") => {
    console.log("OK: %s", message);
    return res.status(200).json({ data });
  },
  Error: (res, statusCode, message = "something went wrong") => {
    const messages = {
      "400": "Bad Request: %s",
      "404": "Not Found: %s",
      "500": "Internal Server Error: %s",
    };

    console.error(messages[statusCode], message);
    return res.status(statusCode).json({ message });
  },
};

export const getOrInitializeMapValue = (map, key, defaultValue) => {
  if (!map.has(key)) {
    map.set(key, defaultValue);
  }
  return map.get(key);
};
