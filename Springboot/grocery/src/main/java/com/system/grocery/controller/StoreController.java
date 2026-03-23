package com.system.grocery.controller;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.system.grocery.entity.Store;
import com.system.grocery.service.StoreService;

@RestController
@RequestMapping("/stores")
public class StoreController {

    @Autowired
    private StoreService service;

    @PostMapping
    public Store create(@RequestBody Store s){ return service.save(s); }

    @GetMapping
    public List<Store> all(){ return service.getAll(); }

    @GetMapping("/{id}")
    public Store one(@PathVariable Integer id){ return service.getById(id); }

    @PutMapping
    public Store update(@RequestBody Store s){ return service.save(s); }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Integer id){ return service.delete(id); }
}
