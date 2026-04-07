export class ThreekitMetadataService {
  meta: { [key: string]: string };

  constructor(meta: { [key: string]: string }) {
    this.meta = meta;
  }

  /**
   *  Retrieves the stage ID from the metadata.
   */
  public getStageId(): string | undefined {
    console.log("this.meta --- ==== ", this.meta);
    const stageId = this.meta["stageId"];

    if (!stageId) return undefined;

    return stageId;
  }
}
