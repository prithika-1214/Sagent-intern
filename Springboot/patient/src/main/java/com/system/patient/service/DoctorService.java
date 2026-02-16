package com.system.patient.service;

import com.system.patient.entity.Doctor;
import com.system.patient.repository.DoctorRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DoctorService {

    private final DoctorRepository doctorRepository;

    public DoctorService(DoctorRepository doctorRepository) {
        this.doctorRepository = doctorRepository;
    }

    public Doctor save(Doctor doctor) {
        return doctorRepository.save(doctor);
    }

    public List<Doctor> getAll() {
        return doctorRepository.findAll();
    }

    public Doctor getById(Integer id) {
        return doctorRepository.findById(id).orElse(null);
    }

    public Doctor update(Integer id, Doctor doctor) {
        doctor.setId(id);
        return doctorRepository.save(doctor);
    }

    public void delete(Integer id) {
        doctorRepository.deleteById(id);
    }
}
