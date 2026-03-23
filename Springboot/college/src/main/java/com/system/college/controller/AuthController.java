package com.system.college.controller;

import com.system.college.entity.Student;
import com.system.college.entity.Officer;
import com.system.college.repository.StudentRepository;
import com.system.college.repository.OfficerRepository;

import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Optional;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "http://localhost:3000")  // For React
public class AuthController {

    private final StudentRepository studentRepo;
    private final OfficerRepository officerRepo;
    private final BCryptPasswordEncoder encoder;

    public AuthController(StudentRepository studentRepo,
                          OfficerRepository officerRepo,
                          BCryptPasswordEncoder encoder) {
        this.studentRepo = studentRepo;
        this.officerRepo = officerRepo;
        this.encoder = encoder;
    }

    private boolean isBcryptHash(String value) {
        if (value == null) {
            return false;
        }
        return value.startsWith("$2a$") || value.startsWith("$2b$") || value.startsWith("$2y$");
    }

    private boolean matchesPassword(String rawPassword, String storedPassword) {
        if (rawPassword == null || storedPassword == null) {
            return false;
        }
        if (isBcryptHash(storedPassword)) {
            return encoder.matches(rawPassword, storedPassword);
        }
        // Legacy support for manually inserted plain-text records
        return rawPassword.equals(storedPassword);
    }

    // ==========================
    // STUDENT REGISTER
    // ==========================
    @PostMapping("/student/register")
    public String registerStudent(@RequestBody Student student) {

        if (studentRepo.findByEmail(student.getEmail()).isPresent()) {
            return "Email already exists!";
        }

        student.setPassword(encoder.encode(student.getPassword()));
        student.setRole("STUDENT");

        studentRepo.save(student);
        return "Student registered successfully";
    }

    // ==========================
    // STUDENT LOGIN
    // ==========================
    @PostMapping("/student/login")
    public String loginStudent(@RequestBody Student student) {
        String email = student.getEmail() == null ? null : student.getEmail().trim();

        Optional<Student> existing =
                studentRepo.findByEmail(email);

        if (existing.isEmpty()) {
            return "Invalid Email!";
        }

        Student dbStudent = existing.get();

        if (!matchesPassword(student.getPassword(), dbStudent.getPassword())) {
            return "Invalid Password!";
        }

        boolean shouldSave = false;
        if (!isBcryptHash(dbStudent.getPassword())) {
            dbStudent.setPassword(encoder.encode(student.getPassword()));
            shouldSave = true;
        }
        if (dbStudent.getRole() == null || dbStudent.getRole().isBlank()) {
            dbStudent.setRole("STUDENT");
            shouldSave = true;
        }
        if (shouldSave) {
            studentRepo.save(dbStudent);
        }

        return "Login successful!";
    }

    // ==========================
    // OFFICER REGISTER  ✅ NEW
    // ==========================
    @PostMapping("/officer/register")
    public String registerOfficer(@RequestBody Officer officer) {

        if (officerRepo.findByEmail(officer.getEmail()).isPresent()) {
            return "Email already exists!";
        }

        officer.setPassword(encoder.encode(officer.getPassword()));
        officer.setRole("OFFICER");

        officerRepo.save(officer);
        return "Officer registered successfully";
    }

    // ==========================
    // OFFICER LOGIN
    // ==========================
    @PostMapping("/officer/login")
    public String loginOfficer(@RequestBody Officer officer) {
        String email = officer.getEmail() == null ? null : officer.getEmail().trim();

        Optional<Officer> existing =
                officerRepo.findByEmail(email);

        if (existing.isEmpty()) {
            return "Invalid Email!";
        }

        Officer dbOfficer = existing.get();

        if (!matchesPassword(officer.getPassword(), dbOfficer.getPassword())) {
            return "Invalid Password!";
        }

        boolean shouldSave = false;
        if (!isBcryptHash(dbOfficer.getPassword())) {
            dbOfficer.setPassword(encoder.encode(officer.getPassword()));
            shouldSave = true;
        }
        if (dbOfficer.getRole() == null || dbOfficer.getRole().isBlank()) {
            dbOfficer.setRole("OFFICER");
            shouldSave = true;
        }
        if (shouldSave) {
            officerRepo.save(dbOfficer);
        }

        return "Officer login successful!";
    }
}
