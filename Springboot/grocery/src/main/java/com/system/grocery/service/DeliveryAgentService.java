package com.system.grocery.service;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.system.grocery.entity.DeliveryAgent;
import com.system.grocery.repository.DeliveryAgentRepository;

@Service
public class DeliveryAgentService {

    @Autowired
    private DeliveryAgentRepository repo;

    public DeliveryAgent save(DeliveryAgent da) {
        return repo.save(da);
    }

    public List<DeliveryAgent> getAll() {
        return repo.findAll();
    }

    public DeliveryAgent getById(Integer id) {
        return repo.findById(id).orElse(null);
    }

    public String delete(Integer id) {
        if (repo.existsById(id)) {
            repo.deleteById(id);
            return "Delivery Agent deleted";
        }
        return "Delivery Agent not found";
    }
}
