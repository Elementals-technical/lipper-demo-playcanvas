import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { ConfiguratorStateI, AttributeState } from "./type";

const initialState: ConfiguratorStateI = {
  isProcessing: false,
  stageCamera: 1,
  attributes: {},
  apiReady: false,
};

export const configuratorSlice = createSlice({
  name: "configurator",
  initialState,
  reducers: {
    changeProcessing: (
      state,
      action: PayloadAction<{ isProcessing: boolean }>,
    ) => {
      state.isProcessing = action.payload.isProcessing;
    },
    setStageCamera: (state, action: PayloadAction<number>) => {
      state.stageCamera = action.payload;
    },
    setAttributes: (
      state,
      action: PayloadAction<Record<string, AttributeState>>,
    ) => {
      state.attributes = action.payload;
    },
    setActiveItem: (
      state,
      action: PayloadAction<{
        name: string;
        data: Partial<AttributeState>;
      }>,
    ) => {
      const { name, data } = action.payload;
      state.attributes[name] = { ...state.attributes[name], ...data };
    },
    setApiReady: (state, action: PayloadAction<boolean>) => {
      state.apiReady = action.payload;
    },
  },
});

export const {
  changeProcessing,
  setStageCamera,
  setAttributes,
  setActiveItem,
  setApiReady,
} = configuratorSlice.actions;

export default configuratorSlice.reducer;
