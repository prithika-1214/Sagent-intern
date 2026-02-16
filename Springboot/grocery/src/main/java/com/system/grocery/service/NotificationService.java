package com.system.grocery.service;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.system.grocery.entity.Notification;
import com.system.grocery.repository.NotificationRepository;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository repo;

    public Notification save(Notification n) {
        return repo.save(n);
    }

    public List<Notification> getAll() {
        return repo.findAll();
    }

    public Notification getById(Integer id) {
        return repo.findById(id).orElse(null);
    }

    public String delete(Integer id) {
        if (repo.existsById(id)) {
            repo.deleteById(id);
            return "Notification deleted";
        }
        return "Notification not found";
    }
}
