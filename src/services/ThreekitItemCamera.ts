type CameraMeta = {
  [key: string]: string;
};

export class ThreekitItemCamera {
  private meta: CameraMeta;

  constructor(meta: CameraMeta) {
    this.meta = meta;
  }
  // 🎯 private method - returns the 360 cameras list
  get360CamerasList(): number[] {
    const cam360 = this.meta["camera-360"];

    if (cam360) {
      const cameras360: number[] = [];

      // Приклад формату: "1-7"
      const [start, end] = cam360.split("-").map(Number);
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) {
          cameras360.push(i);
        }
        return cameras360;
      }
    }

    // Дефолтний список камер
    return [1, 2, 3, 4, 5, 6, 7];
  }

  // 🎯 private method - returns the central camera from the 360 cameras list
  private getCentralCamera(): number {
    const cameras360 = this.get360CamerasList();
    console.log("cameras360 --- ==== ", cameras360);
    const middleIndex = Math.floor(cameras360.length / 2);
    return cameras360[middleIndex];
  }

  // 🎯 private method - returns the corner camera
  private getAngleCamera(): number {
    const cameras360 = this.get360CamerasList();
    const lastIndex = cameras360.length - 1;

    if (cameras360.length === 3) {
      // If there are only 3 cameras, return the last one as the corner camera
      return cameras360[cameras360.length - 1];
    }

    return cameras360[Math.max(0, lastIndex - 1)];
  }

  // 🎯 Публічний метод — повертає дані для слайдеру
  public getSliderCameras(): number[] {
    // Slider format: [central, corner, top, dimension]
    // Example: if the central camera is 4, the corner camera is 6, the top camera is 8, the dimension is 9,
    // then the slider will look like this: [4, 6, 8, 9]
    // Where:
    // 4 - central camera
    // 6 - corner camera
    // 8 - top camera (if available)
    // 9 - dimension camera (if available)
    // If top or dimension camera is not available, it is not included in the slider
    const sliderCameras: number[] = [];

    const cam1Meta = this.meta["Camera_1"];
    const cam1Value = parseInt(cam1Meta, 10);
    if (!isNaN(cam1Value)) sliderCameras.push(cam1Value);

    const cam2Meta = this.meta["Camera_2"];
    const cam2Value = parseInt(cam2Meta, 10);
    if (!isNaN(cam2Value)) sliderCameras.push(cam2Value);

    const cam3Meta = this.meta["Camera_3"];
    const cam3Value = parseInt(cam3Meta, 10);
    if (!isNaN(cam3Value)) sliderCameras.push(cam3Value);

    const cam4Meta = this.meta["Camera_4"];
    const cam4Value = parseInt(cam4Meta, 10);
    if (!isNaN(cam4Value)) sliderCameras.push(cam4Value);

    // // Центральна камера
    // sliderCameras.push(this.getCentralCamera());

    // // Кутова камера
    // sliderCameras.push(this.getAngleCamera());

    // // Top камера (якщо доступна)
    // const topCamera = this.getTopCameraValue();
    // if (topCamera !== undefined) {
    //   sliderCameras.push(topCamera);
    // }

    // // Dimension камера (якщо доступна)
    // const dimensionCamera = this.getDimensionCameraValue();
    // if (dimensionCamera !== undefined) {
    //   sliderCameras.push(dimensionCamera);
    // }

    return sliderCameras;
  }

  // 🎯 Публічний метод — перевіряє доступність top-камери та повертає її значення
  private getTopCameraValue(): number | undefined {
    const camTop = this.meta["camera-top"];

    if (camTop && camTop.trim().toLowerCase() === "none") {
      return undefined;
    }

    if (camTop && camTop.toLowerCase() !== "none") {
      const topValue = parseInt(camTop, 10);
      return !isNaN(topValue) ? topValue : undefined;
    }
    return 8;
  }

  // 🎯 Публічний метод — перевіряє доступність dimension-камери та повертає її значення
  public getDimensionCameraValue(): number | undefined {
    const camDim = this.meta["camera-dimension"];

    if (camDim && camDim.trim().toLowerCase() === "none") {
      return undefined;
    }

    if (camDim && camDim.toLowerCase() !== "none") {
      const dimValue = parseInt(camDim, 10);
      return !isNaN(dimValue) ? dimValue : undefined;
    }
    return 9;
  }

  public getCameraConfig() {
    const data360Cameras = this.get360CamerasList();

    return {
      cameras360: data360Cameras,
      startCamera: data360Cameras[0],
      endCamera: data360Cameras[data360Cameras.length - 1],
    };
  }
}
