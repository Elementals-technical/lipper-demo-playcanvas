import s from "./ProductSettings.module.scss";
import { LogoIcon } from "../../assets/img/svg/LogoIconIcon";
import { useConfiguratorAPI } from "../../hooks/useConfiguratorAPI";
import { useAttribute, getMockAttributes } from "../../configurator";
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

const ASSEMBLY_NAMES = [
  "Hub Assembly",
  "Spindle Assembly",
  "Spring Assembly",
  "Brake Assembly",
];

const ACTION_NAMES = ["Explode", "Annotations"];

// ── Toggle for assembly visibility ──
const AssemblyToggle = ({ name }: { name: string }) => {
  const [attribute, setAttribute] = useAttribute(name);
  const dispatch = useAppDispatch();

  if (!attribute) return null;

  const isOn = attribute.value === true;

  const toggle = () => {
    const newValue = !isOn;
    setAttribute(newValue);
    dispatch(
      setActiveItem({ name, data: { activeItem: String(newValue), img: "" } }),
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

// ── Action button (Explode / Annotations) ──
const ActionButton = ({
  name,
  icon,
}: {
  name: string;
  icon: React.ReactNode;
}) => {
  const [attribute, setAttribute] = useAttribute(name);
  const dispatch = useAppDispatch();

  if (!attribute) return null;

  const isOn = attribute.value === true;

  const toggle = () => {
    const newValue = !isOn;
    setAttribute(newValue);
    dispatch(
      setActiveItem({ name, data: { activeItem: String(newValue), img: "" } }),
    );
  };

  return (
    <button
      className={`${s.actionBtn} ${isOn ? s.active : ""}`}
      onClick={toggle}
    >
      {icon}
      {name === "Explode" ? (isOn ? "Collapse" : "Explode") : name}
    </button>
  );
};

export const ProductSettings: React.FC = () => {
  const { state, setConfig, resetConfig, isReady } = useConfiguratorAPI();
  const apiReady = useAppSelector(getApiReady);
  const mocks = getMockAttributes();

  const handleCamera = (value: string) => {
    setConfig({ cameraPosition: value });
  };

  // Only show assemblies/actions that exist in Vivid API
  const visibleAssemblies = ASSEMBLY_NAMES.filter((n) => mocks[n]);
  const visibleActions = ACTION_NAMES.filter((n) => mocks[n]);

  return (
    <div className={s.panel}>
      <div className={s.header}>
        <LogoIcon />
        <div className={s.headerTitle}>Vivid LCI1</div>
      </div>

      <div className={s.content}>
        {!isReady || !apiReady ? (
          <div className={s.waiting}>Waiting for 3D model...</div>
        ) : (
          <>
            {/* Explode + Annotations row */}
            {visibleActions.length > 0 && (
              <div className={s.actionRow}>
                {visibleActions.includes("Explode") && (
                  <ActionButton
                    name="Explode"
                    icon={
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                        <path d="M2 17l10 5 10-5" />
                        <path d="M2 12l10 5 10-5" />
                      </svg>
                    }
                  />
                )}
                {visibleActions.includes("Annotations") && (
                  <ActionButton
                    name="Annotations"
                    icon={
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    }
                  />
                )}
              </div>
            )}

            {/* Assembly Visibility */}
            {visibleAssemblies.length > 0 && (
              <div className={s.section}>
                <div className={s.sectionTitle}>Assemblies</div>
                <div className={s.toggleList}>
                  {visibleAssemblies.map((name) => (
                    <AssemblyToggle key={name} name={name} />
                  ))}
                </div>
              </div>
            )}

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
            <path d="M3 12a9 9 0 1 1 3 6.9" />
            <path d="M3 21v-6h6" />
          </svg>
          Reset Configuration
        </button>
      </div>
    </div>
  );
};
