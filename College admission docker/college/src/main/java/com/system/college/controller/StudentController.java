package com.system.college.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.system.college.entity.Student;
import com.system.college.service.StudentService;

@RestController
@RequestMapping("/students")
public class StudentController {

    private final StudentService service;

    // ✅ Manual constructor (instead of Lombok)
    public StudentController(StudentService service) {
        this.service = service;
    }

    // 1️⃣ GET ALL
    @GetMapping
    public List<Student> getAll() {
        return service.getAll();
    }

    // 2️⃣ GET BY ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Integer id) {

        Student student = service.getById(id);

        if (student != null) {
            return ResponseEntity.ok(student);
        }

        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body("The student is not found");
    }

    // 3️⃣ POST (Create)
    @PostMapping
    public ResponseEntity<Student> create(@RequestBody Student student) {
        Student savedStudent = service.save(student);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedStudent);
    }

    // 4️⃣ PUT (Full Update)
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Integer id,
                                    @RequestBody Student student) {

        Student updatedStudent = service.update(id, student);

        if (updatedStudent != null) {
            return ResponseEntity.ok(updatedStudent);
        }

        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body("The student is not found");
    }

    // 5️⃣ DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteStudent(@PathVariable Integer id) {

        Student existingStudent = service.getById(id);

        if (existingStudent == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("The student is not found");
        }

        service.deleteStudent(id);

        return ResponseEntity.ok("Student deleted successfully");
    }
}
