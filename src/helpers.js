export const getOrInitializeMapValue = (map, key, defaultValue) => {
  if (!map.has(key)) {
    map.set(key, defaultValue);
  }

  return map.get(key);
};
