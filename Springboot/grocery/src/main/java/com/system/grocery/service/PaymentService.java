package com.system.grocery.service;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.system.grocery.entity.Payment;
import com.system.grocery.repository.PaymentRepository;

@Service
public class PaymentService {

    @Autowired
    private PaymentRepository repo;

    public Payment save(Payment p) {
        return repo.save(p);
    }

    public List<Payment> getAll() {
        return repo.findAll();
    }

    public Payment getById(Integer id) {
        return repo.findById(id).orElse(null);
    }

    public String delete(Integer id) {
        if (repo.existsById(id)) {
            repo.deleteById(id);
            return "Payment deleted";
        }
        return "Payment not found";
    }
}
