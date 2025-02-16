export function clearData(dataElement) {
  dataElement.innerHTML = "";
}

export function printParagraph(parent, output, overwriteData = false) {
  if (overwriteData) {
    clearData(parent);
  }

  const newChild = document.createElement("p");
  newChild.innerHTML = output;

  parent.appendChild(newChild);
}

export function printList(parent, outputList, overwriteData = false) {
  if (overwriteData) {
    clearData(parent);
  }

  for (const element of outputList) {
    printParagraph(parent, element);
  }
}

export function getOrInitializeMapValue(map, key, defaultValue) {
  if (!map.has(key)) {
    map.set(key, defaultValue);
  }

  return map.get(key);
}
