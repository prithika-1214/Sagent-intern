package com.system.library.service;

import com.system.library.entity.Borrow;
import com.system.library.repository.BorrowRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BorrowService {

    private final BorrowRepository repo;

    public BorrowService(BorrowRepository repo) {
        this.repo = repo;
    }

    public Borrow save(Borrow borrow) {
        return repo.save(borrow);
    }

    public List<Borrow> getAll() {
        return repo.findAll();
    }

    public Borrow getById(int id) {
        return repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Borrow not found"));
    }

    public void delete(int id) {
        if (!repo.existsById(id)) {
            throw new RuntimeException("Borrow not found");
        }
        repo.deleteById(id);
    }
}
