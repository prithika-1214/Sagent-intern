package com.system.grocery.controller;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.system.grocery.entity.Payment;
import com.system.grocery.service.PaymentService;

@RestController
@RequestMapping("/payments")
public class PaymentController {

    @Autowired
    private PaymentService service;

    @PostMapping
    public Payment create(@RequestBody Payment p){ return service.save(p); }

    @GetMapping
    public List<Payment> all(){ return service.getAll(); }

    @GetMapping("/{id}")
    public Payment one(@PathVariable Integer id){ return service.getById(id); }

    @PutMapping
    public Payment update(@RequestBody Payment p){ return service.save(p); }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Integer id){ return service.delete(id); }
}
