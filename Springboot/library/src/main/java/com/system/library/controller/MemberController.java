package com.system.library.controller;

import java.util.List;
import org.springframework.web.bind.annotation.*;
import com.system.library.entity.Member;
import com.system.library.service.MemberService;

@RestController
@RequestMapping("/members")
public class MemberController {

    private final MemberService service;

    public MemberController(MemberService service) {
        this.service = service;
    }

    @PostMapping
    public Member add(@RequestBody Member member) {
        return service.save(member);
    }

    @GetMapping
    public List<Member> getAll() {
        return service.getAll();
    }

    @PutMapping("/{id}")
    public Member update(@PathVariable int id, @RequestBody Member member) {
        member.setId(id);
        return service.save(member);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable int id) {
        service.delete(id);
        return "Member deleted successfully";
    }
}
