package com.system.library.service;

import com.system.library.entity.Book;
import com.system.library.repository.BookRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BookService {

    private final BookRepository repo;

    public BookService(BookRepository repo) {
        this.repo = repo;
    }

    public Book save(Book book) {
        return repo.save(book);
    }

    public List<Book> getAll() {
        return repo.findAll();
    }

    public Book getById(int id) {
        return repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Book not found"));
    }

    public void delete(int id) {
        if (!repo.existsById(id)) {
            throw new RuntimeException("Book not found");
        }
        repo.deleteById(id);
    }
}
