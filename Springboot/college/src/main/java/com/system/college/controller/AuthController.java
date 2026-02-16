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

        Optional<Student> existing =
                studentRepo.findByEmail(student.getEmail());

        if (existing.isEmpty()) {
            return "Invalid Email!";
        }

        if (!encoder.matches(student.getPassword(),
                existing.get().getPassword())) {
            return "Invalid Password!";
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

        Optional<Officer> existing =
                officerRepo.findByEmail(officer.getEmail());

        if (existing.isEmpty()) {
            return "Invalid Email!";
        }

        if (!encoder.matches(officer.getPassword(),
                existing.get().getPassword())) {
            return "Invalid Password!";
        }

        return "Officer login successful!";
    }
}
