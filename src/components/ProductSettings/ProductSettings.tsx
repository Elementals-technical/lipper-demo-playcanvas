import s from "./ProductSettings.module.scss";
import { LogoIcon } from "../../assets/img/svg/LogoIconIcon";
import { useConfiguratorAPI, ConfiguratorState } from "../../hooks/useConfiguratorAPI";
import { useAttribute, getMockAttributes, isBooleanAttr } from "../../configurator";
import { useAppSelector, useAppDispatch } from "../../store/store";
import { getApiReady } from "../../store/slices/configurator/selectors/selectors";
import { setActiveItem } from "../../store/slices/configurator/Configurator.sclice";

const CAMERA_OPTIONS = [
  { value: "iso", label: "Isometric" },
  { value: "top", label: "Top" },
  { value: "front", label: "Front" },
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
  { value: "back", label: "Back" },
];

// ── Toggle attribute (Brake, Spring, Spindle, Explode, Annotations) ──
const ToggleAttribute = ({ name }: { name: string }) => {
  const [attribute, setAttribute] = useAttribute(name);
  const dispatch = useAppDispatch();

  if (!attribute) return null;

  const isOn = attribute.value === true;

  const toggle = () => {
    const newValue = !isOn;
    setAttribute(newValue);
    dispatch(
      setActiveItem({
        name,
        data: {
          activeItem: String(newValue),
          img: "",
        },
      }),
    );
  };

  return (
    <label className={s.toggle}>
      <input type="checkbox" checked={isOn} onChange={toggle} />
      <span className={s.toggleTrack}>
        <span className={s.toggleThumb} />
      </span>
      <span className={s.toggleLabel}>{name}</span>
    </label>
  );
};

// ── Color attribute (Hub Assembly) ──
const ColorAttribute = ({ name }: { name: string }) => {
  const [attribute, setAttribute] = useAttribute(name);
  const dispatch = useAppDispatch();

  if (!attribute) return null;

  const currentAssetId =
    typeof attribute.value === "object" && "assetId" in attribute.value
      ? attribute.value.assetId
      : "";

  return (
    <div className={s.section}>
      <div className={s.sectionTitle}>{name}</div>
      <div className={s.colorGrid}>
        {attribute.values.map((variant) => {
          const bg = (variant.metadata._bg as string) ?? "#ccc";
          const isActive = variant.assetId === currentAssetId;

          return (
            <button
              key={variant.assetId}
              className={`${s.colorSwatch} ${isActive ? s.active : ""}`}
              style={{ backgroundColor: bg }}
              title={variant.label}
              onClick={() => {
                setAttribute(variant.assetId);
                dispatch(
                  setActiveItem({
                    name,
                    data: {
                      activeItem: variant.label,
                      img: variant.metadata._img ?? "",
                    },
                  }),
                );
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export const ProductSettings: React.FC = () => {
  const { state, setConfig, resetConfig, isReady } = useConfiguratorAPI();
  const apiReady = useAppSelector(getApiReady);
  const mocks = getMockAttributes();

  const handleCamera = (value: string) => {
    setConfig({ cameraPosition: value });
  };

  // Split attributes into toggles and non-toggles
  const toggleNames = Object.keys(mocks).filter(isBooleanAttr);
  const colorNames = Object.keys(mocks).filter((n) => !isBooleanAttr(n));

  return (
    <div className={s.panel}>
      <div className={s.header}>
        <LogoIcon />
        <div className={s.headerTitle}>3D Configurator</div>
      </div>

      <div className={s.content}>
        {!isReady || !apiReady ? (
          <div className={s.waiting}>Waiting for 3D model...</div>
        ) : (
          <>
            {/* Color options (Hub Assembly) */}
            {colorNames.map((name) => (
              <ColorAttribute key={name} name={name} />
            ))}

            {/* Toggle assemblies */}
            <div className={s.section}>
              <div className={s.sectionTitle}>Assemblies & Controls</div>
              <div className={s.toggleList}>
                {toggleNames.map((name) => (
                  <ToggleAttribute key={name} name={name} />
                ))}
              </div>
            </div>

            {/* Camera */}
            <div className={s.section}>
              <div className={s.sectionTitle}>Camera</div>
              <div className={s.cameraGrid}>
                {CAMERA_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={`${s.cameraBtn} ${state?.cameraPosition === opt.value ? s.active : ""}`}
                    onClick={() => handleCamera(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div className={s.footer}>
        <button className={s.resetBtn} onClick={resetConfig} disabled={!isReady}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 1 3 6.9" /><path d="M3 21v-6h6" />
          </svg>
          Reset Configuration
        </button>
      </div>
    </div>
  );
};
