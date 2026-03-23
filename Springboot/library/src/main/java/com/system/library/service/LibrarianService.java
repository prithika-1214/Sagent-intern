package com.system.library.service;

import com.system.library.entity.Librarian;
import com.system.library.repository.LibrarianRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class LibrarianService {

    private final LibrarianRepository repo;

    public LibrarianService(LibrarianRepository repo) {
        this.repo = repo;
    }

    public Librarian save(Librarian librarian) {
        if (librarian == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Librarian payload is required");
        }

        String name = normalize(librarian.getName());
        String email = normalize(librarian.getEmail());
        String password = normalize(librarian.getPassword());

        if (name == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name is required");
        }
        if (email == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "email is required");
        }
        if (password == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "password is required");
        }

        librarian.setName(name);
        librarian.setEmail(email.toLowerCase());
        librarian.setPassword(password);

        if (librarian.getContact() == null) {
            librarian.setContact("");
        }

        Integer currentId = librarian.getId() > 0 ? librarian.getId() : null;
        repo.findByEmailIgnoreCase(librarian.getEmail())
                .filter(existing -> currentId == null || existing.getId() != currentId)
                .ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
                });

        try {
            return repo.save(librarian);
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }
    }

    public List<Librarian> getAll() {
        return repo.findAll();
    }

    public Librarian getById(int id) {
        return repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Librarian not found"));
    }

    public void delete(int id) {
        if (!repo.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Librarian not found");
        }
        repo.deleteById(id);
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
