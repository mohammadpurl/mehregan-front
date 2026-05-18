import { Notification } from "@/types/notification.interface";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { generateID } from "../utils/string";

type NotificationState = {
    notifications: Notification[];
    showNotification: (notification: Omit<Notification, "id">) => void;
    dismissNotification: (id: string) => void;
};

export const useNotificationStore = create<NotificationState>()(
    devtools((set, get) => ({
        notifications: [],
        showNotification: (notification) => {
            const id = generateID();
            set((state) => ({
                notifications: [
                    ...state.notifications,
                    { id: id, ...notification },
                ],
            }));

            const ms = Math.max(notification.duration ?? 5000, 1500) + 800;
            setTimeout(() => {
                get().dismissNotification(id);
            }, ms);
        },
        dismissNotification: (id) => {
            set((state) => ({
                notifications: state.notifications.filter((p) => p.id !== id),
            }));
        },
    }))
);

export const showNotification = (notifications: Omit<Notification, "id">[]) => {
    notifications.forEach((p) =>
        useNotificationStore.getState().showNotification(p)
    );
};
