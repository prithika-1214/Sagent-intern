package com.system.grocery.service;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.system.grocery.entity.Cart;
import com.system.grocery.repository.CartRepository;

@Service
public class CartService {

    @Autowired
    private CartRepository repo;

    public Cart save(Cart c) {
        return repo.save(c);
    }

    public List<Cart> getAll() {
        return repo.findAll();
    }

    public Cart getById(Integer id) {
        return repo.findById(id).orElse(null);
    }

    public String delete(Integer id) {
        if (repo.existsById(id)) {
            repo.deleteById(id);
            return "Cart deleted";
        }
        return "Cart not found";
    }
}
