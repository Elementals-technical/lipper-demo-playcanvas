declare module "react-dom/client" {
  import * as React from "react";

  export interface Root {
    render(children: React.ReactNode): void;
    unmount(): void;
  }

  export function createRoot(
    container: Element | DocumentFragment,
    options?: {
      identifierPrefix?: string;
      onRecoverableError?: (error: unknown) => void;
    }
  ): Root;

  export function hydrateRoot(
    container: Element | DocumentFragment,
    children: React.ReactNode,
    options?: {
      identifierPrefix?: string;
      onRecoverableError?: (error: unknown) => void;
    }
  ): Root;
}
