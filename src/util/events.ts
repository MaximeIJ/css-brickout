export function createEvent<T>(name: string, obj: T) {
  return new CustomEvent<T>(name, {detail: obj});
}
