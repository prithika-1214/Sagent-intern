package com.system.college.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "student")
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer stuId;

    private String name;
    private LocalDate dob;

    @Column(unique = true)
    private String email;

    @JsonIgnore
    private String password;

    private String role = "STUDENT";   // ✅ Role added

    public Student() {}

    public Integer getStuId() { return stuId; }
    public void setStuId(Integer stuId) { this.stuId = stuId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public LocalDate getDob() { return dob; }
    public void setDob(LocalDate dob) { this.dob = dob; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
