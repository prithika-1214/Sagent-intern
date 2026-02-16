package com.system.college.controller;

import java.util.List;

import com.system.college.entity.Course;
import org.springframework.web.bind.annotation.*;
import com.system.college.service.CourseService;

@RestController
@RequestMapping("/courses")
public class CourseController {

    private final CourseService service;

    public CourseController(CourseService service) {
        this.service = service;
    }

    @GetMapping
    public List<Course> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public Course getById(@PathVariable Integer id) {
        return service.getById(id);
    }

    @PostMapping
    public Course create(@RequestBody Course course) {
        return service.save(course);
    }

    @PutMapping("/{id}")
    public Course update(@PathVariable Integer id,
                         @RequestBody Course course) {
        return service.update(id, course);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Integer id) {
        service.delete(id);
        return "Course deleted successfully";
    }
}
