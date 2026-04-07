import { IConfiguration } from "@threekit-tools/treble/dist/types";

export const load3kit = (tkcsid: any, callback: any) => {
  const existingScript = document.getElementById("threekit_iframe");

  if (!existingScript) {
    const script = document.createElement("script");
    script.src = "https://preview.threekit.com/app/js/threekit-player.js";
    script.id = "threekit_iframe";
    document.body.appendChild(script);
    script.onload = () => {
      if (callback) callback();
    };
  }

  let interval: any = null;
  const callbackIfExist = () => {
    if (!window.threekitPlayer) return false;

    clearInterval(interval);
    callback();
  };

  if (existingScript && callback) {
    callbackIfExist();
    interval = setInterval(() => {
      callbackIfExist();
    }, 50);
  }
};

export const filteredConfigurationBySkipAttr = (configuration: IConfiguration) => {
  const skipAttributes = ["explode", "OnDimensions", "start_script", "Open/Close", "Open/Close Window 1"];
  return Object.entries(configuration).reduce((acc, [attrName, attrValue]) => {
    if (skipAttributes.includes(attrName)) return acc;

    return { ...acc, [attrName]: attrValue };
  }, {});
};
