declare module '*.png' {
  const value: string;
  export default value;
}

declare global {
  interface Window {
    luckysheet: any;
  }
}

export {};