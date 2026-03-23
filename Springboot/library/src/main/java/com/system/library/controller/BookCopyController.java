package com.system.library.controller;

import com.system.library.entity.BookCopy;
import com.system.library.service.BookCopyService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/book-copies")
public class BookCopyController {

    private final BookCopyService service;

    public BookCopyController(BookCopyService service) {
        this.service = service;
    }

    @PostMapping
    public BookCopy create(@RequestBody BookCopy copy) {
        return service.save(copy);
    }

    @GetMapping
    public List<BookCopy> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public BookCopy getById(@PathVariable int id) {
        return service.getById(id);
    }

    @PutMapping("/{id}")
    public BookCopy update(@PathVariable int id, @RequestBody BookCopy copy) {
        copy.setId(id);
        return service.save(copy);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable int id) {
        service.delete(id);
        return "BookCopy deleted successfully";
    }
}
