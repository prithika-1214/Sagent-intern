package com.system.library.service;

import com.system.library.entity.Librarian;
import com.system.library.repository.LibrarianRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LibrarianService {

    private final LibrarianRepository repo;

    public LibrarianService(LibrarianRepository repo) {
        this.repo = repo;
    }

    public Librarian save(Librarian librarian) {
        return repo.save(librarian);
    }

    public List<Librarian> getAll() {
        return repo.findAll();
    }

    public Librarian getById(int id) {
        return repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Librarian not found"));
    }

    public void delete(int id) {
        if (!repo.existsById(id)) {
            throw new RuntimeException("Librarian not found");
        }
        repo.deleteById(id);
    }
}
