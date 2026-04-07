import s from "./ProductSettings.module.scss";
import { LogoIcon } from "../../assets/img/svg/LogoIconIcon";
import { useConfiguratorAPI, ConfiguratorState } from "../../hooks/useConfiguratorAPI";

const CAMERA_OPTIONS = [
  { value: "iso", label: "Isometric" },
  { value: "top", label: "Top" },
  { value: "front", label: "Front" },
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
  { value: "back", label: "Back" },
];

const ASSEMBLY_TOGGLES: { key: keyof ConfiguratorState; label: string }[] = [
  { key: "hubAssemblyVisible", label: "Hub Assembly" },
  { key: "spindleAssemblyVisible", label: "Spindle Assembly" },
  { key: "springAssemblyVisible", label: "Spring Assembly" },
  { key: "brakeAssemblyVisible", label: "Brake Assembly" },
];

export const ProductSettings: React.FC = () => {
  const { state, setConfig, resetConfig, isReady } = useConfiguratorAPI();

  const handleToggle = (key: keyof ConfiguratorState) => {
    if (!state) return;
    setConfig({ [key]: !state[key] });
  };

  const handleCamera = (value: string) => {
    setConfig({ cameraPosition: value });
  };

  return (
    <div className={s.panel}>
      <div className={s.header}>
        <LogoIcon />
        <div className={s.headerTitle}>3D Configurator</div>
      </div>

      <div className={s.content}>
        {!isReady ? (
          <div className={s.waiting}>Waiting for 3D model...</div>
        ) : (
          <>
            {/* Explode + Annotations row */}
            <div className={s.actionRow}>
              <button
                className={`${s.actionBtn} ${state?.explodeStatus ? s.active : ""}`}
                onClick={() => handleToggle("explodeStatus")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                </svg>
                {state?.explodeStatus ? "Collapse" : "Explode"}
              </button>
              <button
                className={`${s.actionBtn} ${state?.annotationsVisible ? s.active : ""}`}
                onClick={() => handleToggle("annotationsVisible")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                Annotations
              </button>
            </div>

            {/* Assembly Visibility */}
            <div className={s.section}>
              <div className={s.sectionTitle}>Assemblies</div>
              <div className={s.toggleList}>
                {ASSEMBLY_TOGGLES.map(({ key, label }) => (
                  <label key={key} className={s.toggle}>
                    <input
                      type="checkbox"
                      checked={!!state?.[key]}
                      onChange={() => handleToggle(key)}
                    />
                    <span className={s.toggleTrack}>
                      <span className={s.toggleThumb} />
                    </span>
                    <span className={s.toggleLabel}>{label}</span>
                  </label>
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
