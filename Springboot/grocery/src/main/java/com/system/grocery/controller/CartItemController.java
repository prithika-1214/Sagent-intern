package com.system.grocery.controller;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.system.grocery.entity.CartItem;
import com.system.grocery.service.CartItemService;

@RestController
@RequestMapping("/cart-items")
public class CartItemController {

    @Autowired
    private CartItemService service;

    @PostMapping
    public CartItem create(@RequestBody CartItem c){ return service.save(c); }

    @GetMapping
    public List<CartItem> all(){ return service.getAll(); }

    @GetMapping("/{id}")
    public CartItem one(@PathVariable Integer id){ return service.getById(id); }

    @PutMapping
    public CartItem update(@RequestBody CartItem c){ return service.save(c); }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Integer id){ return service.delete(id); }
}
