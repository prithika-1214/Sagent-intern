package com.system.library.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.system.library.entity.Book;

public interface BookRepository extends JpaRepository<Book, Integer> {
}
