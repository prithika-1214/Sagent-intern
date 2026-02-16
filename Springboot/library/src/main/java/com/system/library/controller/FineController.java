package com.system.library.controller;

import com.system.library.entity.Fine;
import com.system.library.service.FineService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/fines")
public class FineController {

    private final FineService service;

    public FineController(FineService service) {
        this.service = service;
    }

    @PostMapping
    public Fine create(@RequestBody Fine fine) {
        return service.save(fine);
    }

    @GetMapping
    public List<Fine> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public Fine getById(@PathVariable int id) {
        return service.getById(id);
    }

    @PutMapping("/{id}")
    public Fine update(@PathVariable int id, @RequestBody Fine fine) {
        fine.setId(id);
        return service.save(fine);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable int id) {
        service.delete(id);
        return "Fine deleted successfully";
    }
}
