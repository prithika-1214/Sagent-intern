package com.system.college.service;

import java.util.List;

import com.system.college.entity.Course;
import org.springframework.stereotype.Service;
import com.system.college.repository.CourseRepository;

@Service
public class CourseService {

    private final CourseRepository repo;

    public CourseService(CourseRepository repo) {
        this.repo = repo;
    }

    public List<Course> getAll() {
        return repo.findAll();
    }

    public Course getById(Integer id) {
        return repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));
    }

    public Course save(Course course) {
        return repo.save(course);
    }

    public Course update(Integer id, Course course) {
        Course existing = getById(id);
        existing.setCouName(course.getCouName());
        existing.setDept(course.getDept());
        existing.setDurationDays(course.getDurationDays());
        return repo.save(existing);
    }

    public void delete(Integer id) {
        repo.deleteById(id);
    }
}
