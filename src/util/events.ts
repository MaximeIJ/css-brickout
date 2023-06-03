export function createEvent<T>(name: string, obj: T, bubbles = true) {
  return new CustomEvent<T>(name, {detail: obj, bubbles});
}
