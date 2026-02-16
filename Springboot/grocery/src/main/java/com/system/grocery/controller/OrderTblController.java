package com.system.grocery.controller;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.system.grocery.entity.OrderTbl;
import com.system.grocery.service.OrderTblService;

@RestController
@RequestMapping("/orders")
public class OrderTblController {

    @Autowired
    private OrderTblService service;

    @PostMapping
    public OrderTbl create(@RequestBody OrderTbl o){ return service.save(o); }

    @GetMapping
    public List<OrderTbl> all(){ return service.getAll(); }

    @GetMapping("/{id}")
    public OrderTbl one(@PathVariable Integer id){ return service.getById(id); }

    @PutMapping
    public OrderTbl update(@RequestBody OrderTbl o){ return service.save(o); }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Integer id){ return service.delete(id); }
}
