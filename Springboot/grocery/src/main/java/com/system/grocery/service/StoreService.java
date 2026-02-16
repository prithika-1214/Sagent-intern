package com.system.grocery.service;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.system.grocery.entity.Store;
import com.system.grocery.repository.StoreRepository;

@Service
public class StoreService {

    @Autowired
    private StoreRepository repo;

    public Store save(Store s) {
        return repo.save(s);
    }

    public List<Store> getAll() {
        return repo.findAll();
    }

    public Store getById(Integer id) {
        return repo.findById(id).orElse(null);
    }

    public String delete(Integer id) {
        if (repo.existsById(id)) {
            repo.deleteById(id);
            return "Store deleted";
        }
        return "Store not found";
    }
}
