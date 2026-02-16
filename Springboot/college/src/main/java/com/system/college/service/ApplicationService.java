package com.system.college.service;

import java.util.List;

import com.system.college.entity.Application;
import com.system.college.entity.Course;
import com.system.college.entity.Student;

import org.springframework.stereotype.Service;

import com.system.college.repository.ApplicationRepository;
import com.system.college.repository.StudentRepository;
import com.system.college.repository.CourseRepository;

@Service
public class ApplicationService {

    private final ApplicationRepository repo;
    private final StudentRepository studentRepo;
    private final CourseRepository courseRepo;

    // ✅ Single constructor (Spring will auto inject)
    public ApplicationService(ApplicationRepository repo,
                              StudentRepository studentRepo,
                              CourseRepository courseRepo) {
        this.repo = repo;
        this.studentRepo = studentRepo;
        this.courseRepo = courseRepo;
    }

    // ================= GET ALL =================
    public List<Application> getAll() {
        return repo.findAll();
    }

    // ================= GET BY ID =================
    public Application getById(Integer id) {
        return repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));
    }

    // ================= SAVE =================
    public Application save(Application application) {

        Integer stuId = application.getStudent().getStuId();
        Integer couId = application.getCourse().getCouId();

        Student student = studentRepo.findById(stuId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        Course course = courseRepo.findById(couId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        application.setStudent(student);
        application.setCourse(course);

        return repo.save(application);
    }

    // ================= UPDATE =================
    public Application update(Integer id, Application application) {

        Application existing = getById(id);

        existing.setAddress(application.getAddress());
        existing.setPercentage(application.getPercentage());
        existing.setSubDate(application.getSubDate());

        Integer stuId = application.getStudent().getStuId();
        Integer couId = application.getCourse().getCouId();

        Student student = studentRepo.findById(stuId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        Course course = courseRepo.findById(couId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        existing.setStudent(student);
        existing.setCourse(course);

        return repo.save(existing);
    }

    // ================= DELETE =================
    public void delete(Integer id) {
        repo.deleteById(id);
    }
}
