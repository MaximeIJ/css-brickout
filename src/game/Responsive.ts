// Lazy size reading
export interface Responsive {
  element: HTMLDivElement;
  updateSizes(): void;
  sizes: {width: number; height: number};
}
