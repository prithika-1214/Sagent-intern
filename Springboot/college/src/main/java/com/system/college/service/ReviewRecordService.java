package com.system.college.service;

import java.util.List;

import com.system.college.entity.ReviewRecord;
import org.springframework.stereotype.Service;
import com.system.college.repository.ReviewRecordRepository;

@Service
public class ReviewRecordService {

    private final ReviewRecordRepository repo;

    public ReviewRecordService(ReviewRecordRepository repo) {
        this.repo = repo;
    }

    public List<ReviewRecord> getAll() {
        return repo.findAll();
    }

    public ReviewRecord getById(Integer id) {
        return repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Review record not found"));
    }

    public ReviewRecord save(ReviewRecord record) {
        return repo.save(record);
    }

    public ReviewRecord update(Integer id, ReviewRecord record) {
        ReviewRecord existing = getById(id);
        existing.setApplication(record.getApplication());
        existing.setOfficer(record.getOfficer());
        return repo.save(existing);
    }

    public void delete(Integer id) {
        repo.deleteById(id);
    }
}
