package com.system.grocery.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.system.grocery.entity.Notification;

public interface NotificationRepository extends JpaRepository<Notification, Integer> {
}
