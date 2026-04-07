import { useEffect, useState } from "react";
import { useThreekitInitStatus } from "@threekit-tools/treble/dist";

type Attribute = {
  name: string;
  value: any;
  metadata?: Record<string, any>;
};

const filterConfigByPreview = (config: Record<string, any>, listAttributes: Attribute[] = []): Record<string, any> => {
  const allowedKeys = Object.keys(config).filter((key) => {
    const attribute = listAttributes.find((attr) => attr?.name === key);
    return attribute?.metadata && Object.prototype.hasOwnProperty.call(attribute.metadata, "hasRenderImagePreview");
  });

  return allowedKeys.reduce<Record<string, any>>((acc, key) => {
    const attribute = listAttributes.find((attr) => attr?.name === key);
    acc[key] = attribute?.value;
    return acc;
  }, {});
};

type WaitOpts = {
  /** Function that returns true/false (or Promise<boolean>) */
  predicate: () => boolean | Promise<boolean>;
  timeoutMs?: number; // default 150_000
  intervalMs?: number; // default 300
};

const waitThreekit = (opts: WaitOpts): Promise<void> => {
  const { predicate, timeoutMs = 15000, intervalMs = 300 } = opts;

  const start = Date.now();

  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const ok = await predicate(); // execute your predicate
        if (ok) return resolve(); // if true → done
      } catch {
        // ignore errors and try again
      }

      if (Date.now() - start >= timeoutMs) {
        return reject(new Error("Threekit not ready within timeout"));
      }

      setTimeout(tick, intervalMs); // try again after intervalMs
    };

    tick(); // start the cycle
  });
};

type WaitOptsAditional = {
  /** Function that returns true/false (or Promise<boolean>) */
  predicate?: () => boolean | Promise<boolean>;
  timeoutMs?: number; // default 150_000
  intervalMs?: number; // default 300
};

export const waitThreekitConfiguratorReady = ({
  predicate: extraPredicate,
  timeoutMs = 15000,
  intervalMs = 300,
}: WaitOptsAditional): Promise<void> => {
  // const { predicate: extraPredicate, timeoutMs = 15000, intervalMs = 300 } = opts;

  // Base readiness predicate
  const basePredicate = async () => {
    if (!window.threekit.configurator) return false;
    if (typeof window.threekit.configurator.getConfiguration !== "function") return false;
    const config = await window.threekit.configurator.getConfiguration();
    return !!config;
  };

  // Combined predicate (AND)
  const combinedPredicate = async () => {
    const baseReady = await Promise.resolve(basePredicate());
    if (!extraPredicate) return baseReady;
    const extraReady = await Promise.resolve(extraPredicate());
    return baseReady && extraReady;
  };

  return waitThreekit({
    predicate: combinedPredicate,
    timeoutMs,
    intervalMs,
  });
};

export const useFilteredConfig = (): Record<string, any> | null => {
  const isLoadDefaultConfiguration = useThreekitInitStatus();
  // const listAttributes = useStoreSelector(getListAttributes);
  const [filteredConfig, setFilteredConfig] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        await waitThreekitConfiguratorReady({
          predicate: async () => isLoadDefaultConfiguration,
        });

        const listAttributes = window.threekit.configurator.getDisplayAttributes();
        const config = window.threekit.configurator.getFullConfiguration();
        const result = filterConfigByPreview(config, listAttributes);
        console.log("FastComposer:-filteredConfig", result);

        setFilteredConfig(result);
      } catch (e) {
        console.error("useFilteredConfig error:", e);
        // setFilteredConfig({});
      }
    })();
  }, [isLoadDefaultConfiguration /*, listAttributes*/]);

  return filteredConfig;
};
