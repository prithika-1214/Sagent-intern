package com.system.library.service;

import com.system.library.entity.Member;
import com.system.library.repository.MemberRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MemberService {

    private final MemberRepository repo;

    public MemberService(MemberRepository repo) {
        this.repo = repo;
    }

    public Member save(Member member) {
        return repo.save(member);
    }

    public List<Member> getAll() {
        return repo.findAll();
    }

    public Member getById(int id) {
        return repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Member not found"));
    }

    public void delete(int id) {
        if (!repo.existsById(id)) {
            throw new RuntimeException("Member not found with id: " + id);
        }
        repo.deleteById(id);
    }
}
