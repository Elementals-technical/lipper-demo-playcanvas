export interface AttributeState {
  activeItem: string;
  defaultItem: string;
  img: string;
}

export interface ConfiguratorStateI {
  productId: number;
  isProcessing: boolean;
  stageCamera: number;
  attributes: Record<string, AttributeState>;
  apiReady: boolean;
}
