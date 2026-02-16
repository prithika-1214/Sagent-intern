package com.system.grocery.controller;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.system.grocery.entity.Delivery;
import com.system.grocery.service.DeliveryService;

@RestController
@RequestMapping("/deliveries")
public class DeliveryController {

    @Autowired
    private DeliveryService service;

    @PostMapping
    public Delivery create(@RequestBody Delivery d){ return service.save(d); }

    @GetMapping
    public List<Delivery> all(){ return service.getAll(); }

    @GetMapping("/{id}")
    public Delivery one(@PathVariable Integer id){ return service.getById(id); }

    @PutMapping
    public Delivery update(@RequestBody Delivery d){ return service.save(d); }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Integer id){ return service.delete(id); }
}
