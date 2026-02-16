package com.system.college.service;

import java.util.List;

import com.system.college.entity.Student;
import org.springframework.stereotype.Service;
import com.system.college.repository.StudentRepository;

@Service
public class StudentService {

    private final StudentRepository repo;

    public StudentService(StudentRepository repo) {
        this.repo = repo;
    }

    // 1️⃣ GET ALL
    public List<Student> getAll() {
        return repo.findAll();
    }

    // 2️⃣ GET BY ID (Return null if not found)
    public Student getById(Integer id) {
        return repo.findById(id).orElse(null);   // ✅ changed
    }

    // 3️⃣ SAVE
    public Student save(Student student) {
        return repo.save(student);
    }

    // 4️⃣ UPDATE (Return null if not found)
    public Student update(Integer id, Student student) {

        Student existing = repo.findById(id).orElse(null);   // ✅ changed

        if (existing == null) {
            return null;   // ✅ important
        }

        existing.setName(student.getName());
        existing.setDob(student.getDob());
        existing.setEmail(student.getEmail());
        existing.setPassword(student.getPassword());

        return repo.save(existing);
    }

    // 5️⃣ DELETE (Controller already checks existence)
    public void deleteStudent(Integer id) {
        repo.deleteById(id);   // ✅ simplified
    }
}
