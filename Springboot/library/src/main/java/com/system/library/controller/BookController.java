package com.system.library.controller;

import com.system.library.entity.Book;
import com.system.library.service.BookService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/books")
public class BookController {

    private final BookService service;

    public BookController(BookService service) {
        this.service = service;
    }

    @PostMapping
    public Book create(@RequestBody Book book) {
        return service.save(book);
    }

    @GetMapping
    public List<Book> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public Book getById(@PathVariable int id) {
        return service.getById(id);
    }

    @PutMapping("/{id}")
    public Book update(@PathVariable int id, @RequestBody Book book) {
        book.setId(id);
        return service.save(book);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable int id) {
        service.delete(id);
        return "Book deleted successfully";
    }
}
