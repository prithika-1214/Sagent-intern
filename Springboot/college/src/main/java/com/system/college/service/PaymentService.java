package com.system.college.service;

import java.util.List;

import com.system.college.entity.Payment;
import org.springframework.stereotype.Service;
import com.system.college.repository.PaymentRepository;

@Service
public class PaymentService {

    private final PaymentRepository repo;

    public PaymentService(PaymentRepository repo) {
        this.repo = repo;
    }

    public List<Payment> getAll() {
        return repo.findAll();
    }

    public Payment getById(Integer id) {
        return repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found"));
    }

    public Payment save(Payment payment) {
        return repo.save(payment);
    }

    public Payment update(Integer id, Payment payment) {
        Payment existing = getById(id);
        existing.setPayMethod(payment.getPayMethod());
        existing.setFee(payment.getFee());
        existing.setPayDate(payment.getPayDate());
        existing.setTransactionId(payment.getTransactionId());
        existing.setStatus(payment.getStatus());
        existing.setApplication(payment.getApplication());
        return repo.save(existing);
    }

    public void delete(Integer id) {
        repo.deleteById(id);
    }
}
