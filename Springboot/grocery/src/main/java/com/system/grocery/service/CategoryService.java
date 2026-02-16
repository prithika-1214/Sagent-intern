package com.system.grocery.service;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.system.grocery.entity.Category;
import com.system.grocery.repository.CategoryRepository;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository repo;

    public Category save(Category c) {
        return repo.save(c);
    }

    public List<Category> getAll() {
        return repo.findAll();
    }

    public Category getById(Integer id) {
        return repo.findById(id).orElse(null);
    }

    public String delete(Integer id) {
        if (repo.existsById(id)) {
            repo.deleteById(id);
            return "Category deleted";
        }
        return "Category not found";
    }
}
