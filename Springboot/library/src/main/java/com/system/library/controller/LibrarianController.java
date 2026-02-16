package com.system.library.controller;

import org.springframework.web.bind.annotation.*;
import java.util.List;
import com.system.library.entity.Librarian;
import com.system.library.service.LibrarianService;

@RestController
@RequestMapping("/librarians")
public class LibrarianController {

    private final LibrarianService service;

    public LibrarianController(LibrarianService service) {
        this.service = service;
    }

    @PostMapping
    public Librarian create(@RequestBody Librarian librarian) {
        return service.save(librarian);
    }

    @GetMapping
    public List<Librarian> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public Librarian getById(@PathVariable int id) {
        return service.getById(id);
    }

    @PutMapping("/{id}")
    public Librarian update(@PathVariable int id, @RequestBody Librarian librarian) {
        librarian.setId(id);
        return service.save(librarian);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable int id) {
        service.delete(id);
        return "Librarian deleted successfully";
    }
}
