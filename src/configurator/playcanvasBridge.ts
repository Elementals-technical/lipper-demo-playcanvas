/**
 * PlayCanvas Bridge
 *
 * Maps UI attribute names → ConfiguratorAPI config keys
 * and transforms values for the 3D engine.
 */

// Attribute name → ConfiguratorAPI config key
export const ATTR_TO_PC_KEY: Record<string, string> = {
  'Hub Assembly': 'hubAssemblyVisible',
  'Brake Assembly': 'brakeAssemblyVisible',
  'Spring Assembly': 'springAssemblyVisible',
  'Spindle Assembly': 'spindleAssemblyVisible',
  Explode: 'explodeStatus',
  Annotations: 'annotationsVisible',
};

// Reverse mapping
export const PC_KEY_TO_ATTR: Record<string, string> = Object.fromEntries(
  Object.entries(ATTR_TO_PC_KEY).map(([k, v]) => [v, k]),
);

// Boolean attributes (toggle on/off)
const BOOLEAN_ATTRS = new Set([
  'Brake Assembly',
  'Spring Assembly',
  'Spindle Assembly',
  'Explode',
  'Annotations',
]);

export function isBooleanAttr(attrName: string): boolean {
  return BOOLEAN_ATTRS.has(attrName);
}

export function setPlayCanvasAttribute(
  attrName: string,
  uiValue: unknown,
): void {
  const api = window.ConfiguratorAPI;
  if (!api?.setConfig) return;

  const pcKey = ATTR_TO_PC_KEY[attrName];
  if (!pcKey) return;

  api.setConfig({ [pcKey]: uiValue } as any);
}
