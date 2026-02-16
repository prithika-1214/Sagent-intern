package com.system.patient.service;

import com.system.patient.entity.Vitals;
import com.system.patient.repository.VitalsRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class VitalsService {

    private final VitalsRepository vitalsRepository;

    public VitalsService(VitalsRepository vitalsRepository) {
        this.vitalsRepository = vitalsRepository;
    }

    public Vitals save(Vitals vitals) {
        return vitalsRepository.save(vitals);
    }

    public List<Vitals> getAll() {
        return vitalsRepository.findAll();
    }

    public Vitals getById(Integer id) {
        return vitalsRepository.findById(id).orElse(null);
    }

    public Vitals update(Integer id, Vitals vitals) {
        vitals.setId(id);
        return vitalsRepository.save(vitals);
    }

    public void delete(Integer id) {
        vitalsRepository.deleteById(id);
    }
}
