import { toast } from "react-hot-toast";
import PageHeader from "../components/common/PageHeader";
import Loader from "../components/common/Loader";
import EmptyState from "../components/common/EmptyState";
import useAuth from "../hooks/useAuth";
import useNotifications from "../hooks/useNotifications";
import notificationService from "../services/notificationService";
import { formatDateTime } from "../utils/format";

export default function NotificationsPage() {
  const { user } = useAuth();
  const { notifications, loading, unreadCount, refreshNotifications } = useNotifications(user?.id);

  const markRead = async (notification) => {
    if (notification.isRead) return;
    await notificationService.update({ ...notification, isRead: true });
    await refreshNotifications();
  };

  const markAllRead = async () => {
    await Promise.all(
      notifications
        .filter((item) => !item.isRead)
        .map((item) => notificationService.update({ ...item, isRead: true })),
    );

    await refreshNotifications();
    toast.success("All notifications marked as read");
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Notifications"
        description={`Unread updates: ${unreadCount}`}
        action={
          notifications.length > 0 ? (
            <button
              type="button"
              onClick={markAllRead}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Mark all as read
            </button>
          ) : null
        }
      />

      {loading ? (
        <Loader label="Loading notifications..." />
      ) : notifications.length === 0 ? (
        <EmptyState
          title="No notifications"
          description="Order updates will appear here."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <article
              key={notification.id}
              className={`card border ${
                notification.isRead ? "border-slate-200" : "border-brand-200 bg-brand-50"
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{notification.message}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Order #{notification.orderId || "-"} | {formatDateTime(notification.createdAt)}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">
                    {notification.type || "GENERAL"}
                  </p>
                </div>

                {!notification.isRead && (
                  <button
                    type="button"
                    onClick={() => markRead(notification)}
                    className="rounded-md border border-brand-300 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100"
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
