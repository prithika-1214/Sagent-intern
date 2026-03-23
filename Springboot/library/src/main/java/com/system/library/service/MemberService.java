package com.system.library.service;

import com.system.library.entity.Member;
import com.system.library.repository.MemberRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class MemberService {

    private final MemberRepository repo;

    public MemberService(MemberRepository repo) {
        this.repo = repo;
    }

    public Member save(Member member) {
        if (member == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Member payload is required");
        }

        String name = normalize(member.getName());
        String email = normalize(member.getEmail());
        String password = normalize(member.getPassword());

        if (name == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name is required");
        }
        if (email == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "email is required");
        }
        if (password == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "password is required");
        }

        member.setName(name);
        member.setEmail(email.toLowerCase());
        member.setPassword(password);

        if (member.getContact() == null) {
            member.setContact("");
        }

        Integer currentId = member.getId() > 0 ? member.getId() : null;
        repo.findByEmailIgnoreCase(member.getEmail())
                .filter(existing -> currentId == null || existing.getId() != currentId)
                .ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
                });

        try {
            return repo.save(member);
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }
    }

    public List<Member> getAll() {
        return repo.findAll();
    }

    public Member getById(int id) {
        return repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found"));
    }

    public void delete(int id) {
        if (!repo.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found with id: " + id);
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
