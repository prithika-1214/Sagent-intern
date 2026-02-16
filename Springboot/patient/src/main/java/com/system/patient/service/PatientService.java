package com.system.patient.service;

import com.system.patient.entity.Patient;
import com.system.patient.repository.PatientRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PatientService {

    private final PatientRepository patientRepository;

    public PatientService(PatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }

    public Patient save(Patient patient) {
        return patientRepository.save(patient);
    }

    public List<Patient> getAll() {
        return patientRepository.findAll();
    }

    public Patient getById(Integer id) {
        return patientRepository.findById(id).orElse(null);
    }

    public Patient update(Integer id, Patient patient) {
        patient.setId(id);
        return patientRepository.save(patient);
    }

    public void delete(Integer id) {
        patientRepository.deleteById(id);
    }
}
