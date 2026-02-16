package com.system.grocery.controller;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.system.grocery.entity.DeliveryAgent;
import com.system.grocery.service.DeliveryAgentService;

@RestController
@RequestMapping("/agents")
public class DeliveryAgentController {

    @Autowired
    private DeliveryAgentService service;

    @PostMapping
    public DeliveryAgent create(@RequestBody DeliveryAgent a){ return service.save(a); }

    @GetMapping
    public List<DeliveryAgent> all(){ return service.getAll(); }

    @GetMapping("/{id}")
    public DeliveryAgent one(@PathVariable Integer id){ return service.getById(id); }

    @PutMapping
    public DeliveryAgent update(@RequestBody DeliveryAgent a){ return service.save(a); }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Integer id){ return service.delete(id); }
}
