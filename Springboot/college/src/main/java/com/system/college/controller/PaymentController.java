package com.system.college.controller;

import java.util.List;

import com.system.college.entity.Payment;
import org.springframework.web.bind.annotation.*;
import com.system.college.service.PaymentService;

@RestController
@RequestMapping("/payments")
public class PaymentController {

    private final PaymentService service;

    public PaymentController(PaymentService service) {
        this.service = service;
    }

    @GetMapping
    public List<Payment> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public Payment getById(@PathVariable Integer id) {
        return service.getById(id);
    }

    @PostMapping
    public Payment create(@RequestBody Payment payment) {
        return service.save(payment);
    }

    @PutMapping("/{id}")
    public Payment update(@PathVariable Integer id,
                          @RequestBody Payment payment) {
        return service.update(id, payment);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Integer id) {
        service.delete(id);
        return "Payment deleted successfully";
    }
}
