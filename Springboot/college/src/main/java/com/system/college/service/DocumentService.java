package com.system.college.service;

import java.util.List;

import com.system.college.entity.Document;
import org.springframework.stereotype.Service;
import com.system.college.repository.DocumentRepository;

@Service
public class DocumentService {

    private final DocumentRepository repo;

    public DocumentService(DocumentRepository repo) {
        this.repo = repo;
    }

    public List<Document> getAll() {
        return repo.findAll();
    }

    public Document getById(Integer id) {
        return repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found"));
    }

    public Document save(Document document) {
        return repo.save(document);
    }

    public Document update(Integer id, Document document) {
        Document existing = getById(id);
        existing.setType(document.getType());
        existing.setDocUpload(document.getDocUpload());
        existing.setApplication(document.getApplication());
        return repo.save(existing);
    }

    public void delete(Integer id) {
        repo.deleteById(id);
    }
}
