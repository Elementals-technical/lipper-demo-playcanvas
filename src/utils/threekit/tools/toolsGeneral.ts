export const TOOLS_WHALEN = {
  DRAG_CABINETS_BASE: "drag_cabinets_base",
  DRAG_CABINETS_ISLAND: "drag_cabinets_island",
  DRAG_CABINETS_WALL: "drag_cabinets_wall",
  SELECT_MODELS: "select_object_threekit",
};

export const addCustomTool = (funcTool: any) => {
  window.player.tools.addTool(funcTool);
};
// export const removeCustomTool = (nameTool: string) => {
//   clearSelectThreekit();
//   window.threekit.player.tools.removeTool(nameTool);
// };
// export const activateToolThreekit = (toolKey: string) => {
//   //@ts-ignore
//   window.threekit.player.player.tools.tools[toolKey].enabled = true;
// };
// export const deactivateToolThreekit = (toolKey: string) => {
//   //@ts-ignore
//   window.threekit.player.player.tools.tools[toolKey].enabled = false;
// };
// export const clearSelectThreekit = () => {
//   //@ts-ignore
//   window.threekit.player.selectionSet.clear();
// };
