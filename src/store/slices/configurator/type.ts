export interface AttributeState {
  activeItem: string;
  defaultItem: string;
  img: string;
}

export interface ConfiguratorStateI {
  isProcessing: boolean;
  stageCamera: number;
  attributes: Record<string, AttributeState>;
  apiReady: boolean;
}
