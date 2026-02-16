package com.system.college.controller;

import java.util.List;

import com.system.college.entity.ReviewRecord;
import org.springframework.web.bind.annotation.*;
import com.system.college.service.ReviewRecordService;

@RestController
@RequestMapping("/reviews")
public class ReviewRecordController {

    private final ReviewRecordService service;

    public ReviewRecordController(ReviewRecordService service) {
        this.service = service;
    }

    @GetMapping
    public List<ReviewRecord> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public ReviewRecord getById(@PathVariable Integer id) {
        return service.getById(id);
    }

    @PostMapping
    public ReviewRecord create(@RequestBody ReviewRecord record) {
        return service.save(record);
    }

    @PutMapping("/{id}")
    public ReviewRecord update(@PathVariable Integer id,
                               @RequestBody ReviewRecord record) {
        return service.update(id, record);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Integer id) {
        service.delete(id);
        return "Review record deleted successfully";
    }
}
