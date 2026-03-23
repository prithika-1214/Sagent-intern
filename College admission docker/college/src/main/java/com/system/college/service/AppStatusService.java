package com.system.college.service;

import java.util.List;
import org.springframework.stereotype.Service;
import com.system.college.entity.AppStatus;
import com.system.college.repository.AppStatusRepository;

@Service
public class AppStatusService {

    private final AppStatusRepository repo;

    public AppStatusService(AppStatusRepository repo) {
        this.repo = repo;
    }

    public List<AppStatus> getAll() {
        return repo.findAll();
    }

    public AppStatus getById(Integer id) {
        return repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Status not found"));
    }

    public AppStatus save(AppStatus status) {
        return repo.save(status);
    }

    public AppStatus update(Integer id, AppStatus status) {
        AppStatus existing = getById(id);
        existing.setReview(status.getReview());
        existing.setStatus(status.getStatus());
        existing.setStudent(status.getStudent());
        existing.setOfficer(status.getOfficer());
        return repo.save(existing);
    }

    public void delete(Integer id) {
        repo.deleteById(id);
    }
}
