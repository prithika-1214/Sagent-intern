package com.system.college.config;

import com.system.college.entity.Course;
import com.system.college.repository.CourseRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class CourseSeeder implements CommandLineRunner {

    private final CourseRepository courseRepository;

    public CourseSeeder(CourseRepository courseRepository) {
        this.courseRepository = courseRepository;
    }

    @Override
    public void run(String... args) {
        if (courseRepository.count() > 0) {
            return;
        }

        List<Course> courses = List.of(
                buildCourse("BSc Computer Science", "Science", 1095),
                buildCourse("BSc Information Technology", "Science", 1095),
                buildCourse("BCom", "Commerce", 1095),
                buildCourse("BA Economics", "Arts", 1095),
                buildCourse("BBA", "Management", 1095)
        );

        courseRepository.saveAll(courses);
    }

    private Course buildCourse(String name, String dept, Integer durationDays) {
        Course course = new Course();
        course.setCouName(name);
        course.setDept(dept);
        course.setDurationDays(durationDays);
        return course;
    }
}
