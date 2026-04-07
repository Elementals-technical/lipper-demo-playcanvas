import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { ConfiguratorStateI } from "./type";

const initialState: ConfiguratorStateI = {
  isProcessing: false,
  stageCamera: 1,
};

export const configuratorSlice = createSlice({
  name: "configurator",
  initialState,
  reducers: {
    changeProcessing: (state, action: PayloadAction<{ isProcessing: boolean }>) => {
      state.isProcessing = action.payload.isProcessing;
    },
    setStageCamera: (state, action: PayloadAction<number>) => {
      state.stageCamera = action.payload;
    },
  },
});

export const { changeProcessing, setStageCamera } = configuratorSlice.actions;

export default configuratorSlice.reducer;
