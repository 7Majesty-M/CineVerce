export {};

declare global {
  interface Window {
    kbox: (container: HTMLElement, config: any) => void;
  }
}
