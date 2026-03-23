package com.system.college.controller;

import java.time.LocalDate;
import java.util.List;

import com.system.college.entity.Application;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import com.system.college.service.ApplicationService;

@RestController
@RequestMapping("/applications")
public class ApplicationController {

    private final ApplicationService service;

    public ApplicationController(ApplicationService service) {
        this.service = service;
    }

    @GetMapping(params = "!page")
    public List<Application> getAll() {
        return service.getAll();
    }

    @GetMapping(params = "page")
    public Page<Application> getAllPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer courseId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(defaultValue = "false") boolean excludeDraft
    ) {
        return service.getAllPaged(page, size, search, status, courseId, dateFrom, dateTo, excludeDraft);
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
