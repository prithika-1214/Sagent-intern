package com.system.college.controller;

import java.util.List;

import com.system.college.entity.Document;
import org.springframework.web.bind.annotation.*;
import com.system.college.service.DocumentService;

@RestController
@RequestMapping("/documents")
public class DocumentController {

    private final DocumentService service;

    public DocumentController(DocumentService service) {
        this.service = service;
    }

    @GetMapping
    public List<Document> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public Document getById(@PathVariable Integer id) {
        return service.getById(id);
    }

    @PostMapping
    public Document create(@RequestBody Document document) {
        return service.save(document);
    }

    @PutMapping("/{id}")
    public Document update(@PathVariable Integer id,
                           @RequestBody Document document) {
        return service.update(id, document);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Integer id) {
        service.delete(id);
        return "Document deleted successfully";
    }
}
