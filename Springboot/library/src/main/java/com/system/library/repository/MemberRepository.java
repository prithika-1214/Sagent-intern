package com.system.library.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.system.library.entity.Member;

public interface MemberRepository extends JpaRepository<Member, Integer> {
}
