'use client';

import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { useNotificationStore } from '@/app/_store/notification.store';
import type { Notification } from '@/types/notification.interface';

export type NotificationData = Omit<Notification, 'id'> & { title?: string };

interface NotificationContextType {
  addNotification: (notification: Omit<NotificationData, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const showNotification = useNotificationStore((state) => state.showNotification);
  const dismissNotification = useNotificationStore((state) => state.dismissNotification);

  const stableAddNotification = useCallback(
    (notification: Omit<NotificationData, 'id'>) => {
      const { title, message, ...rest } = notification;
      const text =
        title && message && title !== message
          ? `${title}: ${message}`
          : String(message ?? title ?? '');
      showNotification({ ...rest, message: text });
    },
    [showNotification],
  );

  const stableRemoveNotification = useCallback(
    (id: string) => {
      dismissNotification(id);
    },
    [dismissNotification],
  );

  const stableClearAll = useCallback(() => {
    useNotificationStore.setState({ notifications: [] });
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        addNotification: stableAddNotification,
        removeNotification: stableRemoveNotification,
        clearAll: stableClearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};
