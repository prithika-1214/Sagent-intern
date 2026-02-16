package com.system.grocery.service;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.system.grocery.entity.OrderTbl;
import com.system.grocery.repository.OrderTblRepository;

@Service
public class OrderTblService {

    @Autowired
    private OrderTblRepository repo;

    public OrderTbl save(OrderTbl o) {
        return repo.save(o);
    }

    public List<OrderTbl> getAll() {
        return repo.findAll();
    }

    public OrderTbl getById(Integer id) {
        return repo.findById(id).orElse(null);
    }

    public String delete(Integer id) {
        if (repo.existsById(id)) {
            repo.deleteById(id);
            return "Order deleted";
        }
        return "Order not found";
    }
}
