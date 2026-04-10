import React from "react";
import QRCode from "react-qr-code";
import s from "./ArPopup.module.scss";

interface ArPopupProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  qrValue?: string;
  iosArUrl?: string;
  isIOS: boolean;
  qrSize?: number;
}

export const ArPopup: React.FC<ArPopupProps> = ({
  isOpen,
  onClose,
  isLoading,
  qrValue,
  iosArUrl,
  isIOS,
  qrSize = 200,
}) => {
  if (!isOpen) return null;

  return (
    <div className={s.backdrop} onClick={onClose}>
      <div className={s.popup} onClick={(e) => e.stopPropagation()}>
        <div className={s.header}>
          <div className={s.title}>View in AR</div>
          <button className={s.closeBtn} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className={s.subtitle}>
          {isIOS
            ? "Tap the button below to open in AR"
            : "Scan the QR code with your phone to view in your space"}
        </div>

        {isIOS && iosArUrl && (
          <a className={s.iosBtn} rel="ar" href={iosArUrl}>
            <img
              src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
              style={{ width: 1, height: 1 }}
              alt=""
            />
            Open in AR
          </a>
        )}

        <div className={s.qrWrap}>
          {isLoading ? (
            <div className={s.spinner} />
          ) : qrValue ? (
            <QRCode value={qrValue} size={qrSize} />
          ) : (
            <div className={s.message}>Failed to prepare AR model</div>
          )}
        </div>

        <button className={s.doneBtn} onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
};
