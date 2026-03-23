package com.system.grocery.controller;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.system.grocery.entity.Product;
import com.system.grocery.service.ProductService;

@RestController
@RequestMapping("/products")
public class ProductController {

    @Autowired
    private ProductService service;

    @PostMapping
    public Product create(@RequestBody Product p){ return service.save(p); }

    @GetMapping
    public List<Product> all(){ return service.getAll(); }

    @GetMapping("/{id}")
    public Product one(@PathVariable Integer id){ return service.getById(id); }

    @PutMapping
    public Product update(@RequestBody Product p){ return service.save(p); }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Integer id){ return service.delete(id); }
}
