package com.system.college.service;

import java.util.List;

import com.system.college.entity.Officer;
import org.springframework.stereotype.Service;
import com.system.college.repository.OfficerRepository;

@Service
public class OfficerService {

    private final OfficerRepository repo;

    public OfficerService(OfficerRepository repo) {
        this.repo = repo;
    }

    // 1️⃣ GET ALL
    public List<Officer> getAll() {
        return repo.findAll();
    }

    // 2️⃣ GET BY ID (Return null if not found)
    public Officer getById(Integer id) {
        return repo.findById(id).orElse(null);   // ✅ changed
    }

    // 3️⃣ SAVE
    public Officer save(Officer officer) {
        return repo.save(officer);
    }

    // 4️⃣ UPDATE (Return null if not found)
    public Officer update(Integer id, Officer officer) {

        Officer existing = repo.findById(id).orElse(null);

        if (existing == null) {
            return null;   // ✅ important
        }

        existing.setName(officer.getName());
        existing.setEmail(officer.getEmail());
        existing.setPassword(officer.getPassword());

        return repo.save(existing);
    }

    // 5️⃣ DELETE (Controller handles existence check)
    public void delete(Integer id) {
        repo.deleteById(id);
    }
}
