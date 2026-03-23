package com.system.library.controller;

import com.system.library.dto.BorrowRequest;
import com.system.library.entity.Borrow;
import com.system.library.service.BorrowService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/borrows")
public class BorrowController {

    private final BorrowService service;

    public BorrowController(BorrowService service) {
        this.service = service;
    }

    @PostMapping
    public Borrow create(@RequestBody BorrowRequest borrowRequest) {
        return service.create(borrowRequest);
    }

    @GetMapping
    public List<Borrow> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public Borrow getById(@PathVariable int id) {
        return service.getById(id);
    }

    @PutMapping("/{id}")
    public Borrow update(@PathVariable int id, @RequestBody BorrowRequest borrowRequest) {
        return service.update(id, borrowRequest);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable int id) {
        service.delete(id);
        return "Borrow deleted successfully";
    }
}
