export default function isEqual(value1: unknown, value2: unknown): boolean {
  if (value1 === value2) return true;
  if (value1 === null || value2 === null) return false;
  if (value1 === undefined || value2 === undefined) return false;

  if (typeof value1 !== typeof value2) return false;

  if (Array.isArray(value1) && Array.isArray(value2)) {
    if (value1.length !== value2.length) return false;
    return value1.every((item, index) => isEqual(item, value2[index]));
  }

  if (typeof value1 === "object") {
    const keys1 = Object.keys(value1);
    const keys2 = Object.keys(value2);

    if (keys1.length !== keys2.length) return false;

    return keys1.every(
      (key) =>
        Object.prototype.hasOwnProperty.call(value2, key) &&
        isEqual(value1[key], value2[key])
    );
  }

  return value1 === value2;
}
