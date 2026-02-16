package com.system.college.controller;

import java.util.List;
import org.springframework.web.bind.annotation.*;
import com.system.college.entity.AppStatus;
import com.system.college.service.AppStatusService;

@RestController
@RequestMapping("/status")
public class AppStatusController {

    private final AppStatusService service;

    public AppStatusController(AppStatusService service) {
        this.service = service;
    }

    @GetMapping
    public List<AppStatus> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public AppStatus getById(@PathVariable Integer id) {
        return service.getById(id);
    }

    @PostMapping
    public AppStatus create(@RequestBody AppStatus status) {
        return service.save(status);
    }

    @PutMapping("/{id}")
    public AppStatus update(@PathVariable Integer id,
                            @RequestBody AppStatus status) {
        return service.update(id, status);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Integer id) {
        service.delete(id);
        return "Status deleted successfully";
    }
}
