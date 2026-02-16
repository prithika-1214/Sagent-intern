package com.system.grocery.controller;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.system.grocery.entity.User;
import com.system.grocery.service.UserService;

@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserService service;

    @PostMapping
    public User create(@RequestBody User u){
        return service.save(u);
    }

    @GetMapping
    public List<User> getAll(){
        return service.getAll();
    }

    @GetMapping("/{id}")
    public User getById(@PathVariable Integer id){
        return service.getById(id);
    }

    @PutMapping
    public User update(@RequestBody User u){
        return service.save(u);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Integer id){
        return service.delete(id);
    }
}
