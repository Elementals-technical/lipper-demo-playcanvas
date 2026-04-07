import { useState } from 'react';
import { useNotifications, NotificationItem } from '../../hooks/useNotifications';
import s from './NotificationPanel.module.scss';

const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const NotificationCard = ({ item }: { item: NotificationItem }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={s.card}>
      <button className={s.cardHeader} onClick={() => setExpanded(!expanded)}>
        <div className={s.cardLeft}>
          <span className={s.badge}>{item.category}</span>
          <span className={s.cardTitle}>{item.groupName || item.displayName}</span>
        </div>
        <ChevronIcon open={expanded} />
      </button>

      {expanded && (
        <div className={s.cardBody}>
          <div className={s.meta}>
            {item.itemNumber && <span className={s.metaItem}>#{item.itemNumber}</span>}
            {item.partNumber && <span className={s.metaItem}>Part: {item.partNumber}</span>}
            {item.side !== 'Shared' && <span className={s.metaItem}>{item.side}</span>}
          </div>

          {item.description && <p className={s.description}>{item.description}</p>}

          <div className={s.infoGrid}>
            {item.maintenanceInterval && (
              <div className={s.infoItem}>
                <span className={s.infoLabel}>Interval</span>
                <span className={s.infoValue}>{item.maintenanceInterval}</span>
              </div>
            )}
            {item.maintenanceTask && (
              <div className={s.infoItem}>
                <span className={s.infoLabel}>Task</span>
                <span className={s.infoValue}>{item.maintenanceTask}</span>
              </div>
            )}
            {item.commonIssues && (
              <div className={s.infoItem}>
                <span className={s.infoLabel}>Common Issues</span>
                <span className={s.infoValue}>{item.commonIssues}</span>
              </div>
            )}
          </div>

          {item.storeLink && (
            <a
              href={item.storeLink}
              target="_blank"
              rel="noopener noreferrer"
              className={s.storeLink}
            >
              {item.storeLinkText || 'View on Store'} &rarr;
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export const NotificationPanel = () => {
  const { notifications, isLoading, error } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={s.wrapper}>
      <button className={s.trigger} onClick={() => setIsOpen(!isOpen)}>
        <BellIcon />
        {notifications.length > 0 && (
          <span className={s.count}>{notifications.length}</span>
        )}
      </button>

      {isOpen && (
        <>
          <div className={s.backdrop} onClick={() => setIsOpen(false)} />
          <div className={s.panel}>
            <div className={s.panelHeader}>
              <h3 className={s.panelTitle}>Maintenance Notifications</h3>
              <button className={s.closeBtn} onClick={() => setIsOpen(false)}>
                &times;
              </button>
            </div>

            <div className={s.panelBody}>
              {isLoading && <div className={s.status}>Loading...</div>}
              {error && <div className={s.status}>Failed to load notifications</div>}
              {!isLoading && !error && notifications.length === 0 && (
                <div className={s.status}>No notifications</div>
              )}
              {notifications.map((item) => (
                <NotificationCard key={`${item.id}-${item.side}`} item={item} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
