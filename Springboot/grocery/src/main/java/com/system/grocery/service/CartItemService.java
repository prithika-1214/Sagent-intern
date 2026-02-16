package com.system.grocery.service;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.system.grocery.entity.CartItem;
import com.system.grocery.repository.CartItemRepository;

@Service
public class CartItemService {

    @Autowired
    private CartItemRepository repo;

    public CartItem save(CartItem ci) {
        return repo.save(ci);
    }

    public List<CartItem> getAll() {
        return repo.findAll();
    }

    public CartItem getById(Integer id) {
        return repo.findById(id).orElse(null);
    }

    public String delete(Integer id) {
        if (repo.existsById(id)) {
            repo.deleteById(id);
            return "CartItem deleted";
        }
        return "CartItem not found";
    }
}
