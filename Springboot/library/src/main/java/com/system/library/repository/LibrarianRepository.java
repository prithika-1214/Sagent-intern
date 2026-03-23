package com.system.library.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.system.library.entity.Librarian;

public interface LibrarianRepository extends JpaRepository<Librarian, Integer> {
    Optional<Librarian> findByEmailIgnoreCase(String email);
}
