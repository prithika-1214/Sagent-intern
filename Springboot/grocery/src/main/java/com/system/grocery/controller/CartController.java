package com.system.grocery.controller;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.system.grocery.entity.Cart;
import com.system.grocery.service.CartService;

@RestController
@RequestMapping("/carts")
public class CartController {

    @Autowired
    private CartService service;

    @PostMapping
    public Cart create(@RequestBody Cart c){ return service.save(c); }

    @GetMapping
    public List<Cart> all(){ return service.getAll(); }

    @GetMapping("/{id}")
    public Cart one(@PathVariable Integer id){ return service.getById(id); }

    @PutMapping
    public Cart update(@RequestBody Cart c){ return service.save(c); }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Integer id){ return service.delete(id); }
}
