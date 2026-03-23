package com.system.library.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.system.library.entity.BookCopy;

public interface BookCopyRepository extends JpaRepository<BookCopy, Integer> {
}
