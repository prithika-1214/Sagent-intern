package com.system.grocery.controller;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.system.grocery.entity.Notification;
import com.system.grocery.service.NotificationService;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    @Autowired
    private NotificationService service;

    @PostMapping
    public Notification create(@RequestBody Notification n){ return service.save(n); }

    @GetMapping
    public List<Notification> all(){ return service.getAll(); }

    @GetMapping("/{id}")
    public Notification one(@PathVariable Integer id){ return service.getById(id); }

    @PutMapping
    public Notification update(@RequestBody Notification n){ return service.save(n); }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Integer id){ return service.delete(id); }
}
