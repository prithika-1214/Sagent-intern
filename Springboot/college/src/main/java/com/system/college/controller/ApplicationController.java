package com.system.college.controller;

import java.util.List;

import com.system.college.entity.Application;
import org.springframework.web.bind.annotation.*;
import com.system.college.service.ApplicationService;

@RestController
@RequestMapping("/applications")
public class ApplicationController {

    private final ApplicationService service;

    public ApplicationController(ApplicationService service) {
        this.service = service;
    }

    @GetMapping
    public List<Application> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public Application getById(@PathVariable Integer id) {
        return service.getById(id);
    }

    @PostMapping
    public Application create(@RequestBody Application application) {
        return service.save(application);
    }

    @PutMapping("/{id}")
    public Application update(@PathVariable Integer id,
                              @RequestBody Application application) {
        return service.update(id, application);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Integer id) {
        service.delete(id);
        return "Application deleted successfully";
    }
}
