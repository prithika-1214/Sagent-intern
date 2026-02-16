package com.system.grocery.controller;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.system.grocery.entity.Category;
import com.system.grocery.service.CategoryService;

@RestController
@RequestMapping("/categories")
public class CategoryController {

    @Autowired
    private CategoryService service;

    @PostMapping
    public Category create(@RequestBody Category c){ return service.save(c); }

    @GetMapping
    public List<Category> all(){ return service.getAll(); }

    @GetMapping("/{id}")
    public Category one(@PathVariable Integer id){ return service.getById(id); }

    @PutMapping
    public Category update(@RequestBody Category c){ return service.save(c); }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Integer id){ return service.delete(id); }
}
