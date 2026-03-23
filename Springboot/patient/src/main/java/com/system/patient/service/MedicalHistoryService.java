package com.system.patient.service;

import com.system.patient.entity.MedicalHistory;
import com.system.patient.repository.MedicalHistoryRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MedicalHistoryService {

    private final MedicalHistoryRepository medicalHistoryRepository;

    public MedicalHistoryService(MedicalHistoryRepository medicalHistoryRepository) {
        this.medicalHistoryRepository = medicalHistoryRepository;
    }

    public MedicalHistory save(MedicalHistory history) {
        return medicalHistoryRepository.save(history);
    }

    public List<MedicalHistory> getAll() {
        return medicalHistoryRepository.findAll();
    }

    public MedicalHistory getById(Integer id) {
        return medicalHistoryRepository.findById(id).orElse(null);
    }

    public MedicalHistory update(Integer id, MedicalHistory history) {
        history.setId(id);
        return medicalHistoryRepository.save(history);
    }

    public void delete(Integer id) {
        medicalHistoryRepository.deleteById(id);
    }
}
