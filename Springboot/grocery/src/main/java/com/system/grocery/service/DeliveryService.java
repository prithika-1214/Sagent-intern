package com.system.grocery.service;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.system.grocery.entity.Delivery;
import com.system.grocery.repository.DeliveryRepository;

@Service
public class DeliveryService {

    @Autowired
    private DeliveryRepository repo;

    public Delivery save(Delivery d) {
        return repo.save(d);
    }

    public List<Delivery> getAll() {
        return repo.findAll();
    }

    public Delivery getById(Integer id) {
        return repo.findById(id).orElse(null);
    }

    public String delete(Integer id) {
        if (repo.existsById(id)) {
            repo.deleteById(id);
            return "Delivery deleted";
        }
        return "Delivery not found";
    }
}
