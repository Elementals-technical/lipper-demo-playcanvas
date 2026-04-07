export type IframeToParentMsg = { type: "TK_STAGE_CAMERA"; payload: number } | { type: "READY" };

export const sendToParent = (msg: IframeToParentMsg) => {
  // якщо той самий сайт/домен:
  const targetOrigin = window.location.origin;
  window.parent.postMessage(msg, targetOrigin);
};
