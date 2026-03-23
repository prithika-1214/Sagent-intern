package com.system.college.config;

import com.system.college.entity.Student;
import com.system.college.entity.Officer;
import com.system.college.repository.StudentRepository;
import com.system.college.repository.OfficerRepository;

import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final StudentRepository studentRepo;
    private final OfficerRepository officerRepo;

    public CustomUserDetailsService(StudentRepository studentRepo,
                                    OfficerRepository officerRepo) {
        this.studentRepo = studentRepo;
        this.officerRepo = officerRepo;
    }

    @Override
    public UserDetails loadUserByUsername(String email)
            throws UsernameNotFoundException {

        Student student = studentRepo.findByEmail(email).orElse(null);

        if (student != null) {
            return User.builder()
                    .username(student.getEmail())
                    .password(student.getPassword())
                    .authorities(student.getRole())
                    .build();
        }

        Officer officer = officerRepo.findByEmail(email).orElse(null);

        if (officer != null) {
            return User.builder()
                    .username(officer.getEmail())
                    .password(officer.getPassword())
                    .authorities(officer.getRole())
                    .build();
        }

        throw new UsernameNotFoundException("User not found");
    }
}
