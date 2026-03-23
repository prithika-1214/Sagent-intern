package com.system.library.service;

import com.system.library.entity.BookCopy;
import com.system.library.repository.BookCopyRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BookCopyService {

    private final BookCopyRepository repo;

    public BookCopyService(BookCopyRepository repo) {
        this.repo = repo;
    }

    public BookCopy save(BookCopy copy) {
        return repo.save(copy);
    }

    public List<BookCopy> getAll() {
        return repo.findAll();
    }

    public BookCopy getById(int id) {
        return repo.findById(id)
                .orElseThrow(() -> new RuntimeException("BookCopy not found"));
    }

    public void delete(int id) {
        if (!repo.existsById(id)) {
            throw new RuntimeException("BookCopy not found");
        }
        repo.deleteById(id);
    }
}
