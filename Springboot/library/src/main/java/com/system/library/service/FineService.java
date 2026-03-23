package com.system.library.service;

import com.system.library.entity.Fine;
import com.system.library.repository.FineRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FineService {

    private final FineRepository repo;

    public FineService(FineRepository repo) {
        this.repo = repo;
    }

    public Fine save(Fine fine) {
        return repo.save(fine);
    }

    public List<Fine> getAll() {
        return repo.findAll();
    }

    public Fine getById(int id) {
        return repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Fine not found"));
    }

    public void delete(int id) {
        if (!repo.existsById(id)) {
            throw new RuntimeException("Fine not found");
        }
        repo.deleteById(id);
    }
}
