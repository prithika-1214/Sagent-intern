import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import notificationService from "../services/notificationService";

export default function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const knownIdsRef = useRef(new Set());
  const firstFetchDoneRef = useRef(false);

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      return;
    }

    setLoading(true);
    try {
      const data = await notificationService.getByUserId(userId);
      setNotifications(data);

      const nextIds = new Set(data.map((item) => item.id));
      if (firstFetchDoneRef.current) {
        const freshItems = data.filter((item) => !knownIdsRef.current.has(item.id));
        freshItems.forEach((item) => {
          toast.success(item.message || "Order status updated");
        });
      }

      knownIdsRef.current = nextIds;
      firstFetchDoneRef.current = true;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();

    const timer = setInterval(() => {
      fetchNotifications();
    }, 20000);

    return () => clearInterval(timer);
  }, [fetchNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications],
  );

  return {
    notifications,
    loading,
    unreadCount,
    refreshNotifications: fetchNotifications,
  };
}
