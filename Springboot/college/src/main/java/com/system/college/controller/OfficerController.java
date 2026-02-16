package com.system.college.controller;

import java.util.List;

import com.system.college.entity.Officer;
import com.system.college.service.OfficerService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/officers")
public class OfficerController {

    private final OfficerService service;

    public OfficerController(OfficerService service) {
        this.service = service;
    }

    // 1️⃣ GET ALL
    @GetMapping
    public List<Officer> getAll() {
        return service.getAll();
    }

    // 2️⃣ GET BY ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Integer id) {

        Officer officer = service.getById(id);

        if (officer != null) {
            return ResponseEntity.ok(officer);
        }

        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body("The officer is not found");
    }

    // 3️⃣ POST
    @PostMapping
    public ResponseEntity<Officer> create(@RequestBody Officer officer) {
        Officer savedOfficer = service.save(officer);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedOfficer);
    }

    // 4️⃣ PUT
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Integer id,
                                    @RequestBody Officer officer) {

        Officer updatedOfficer = service.update(id, officer);

        if (updatedOfficer != null) {
            return ResponseEntity.ok(updatedOfficer);
        }

        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body("The officer is not found");
    }

    // 5️⃣ DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Integer id) {

        Officer existingOfficer = service.getById(id);

        if (existingOfficer == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("The officer is not found");
        }

        service.delete(id);
        return ResponseEntity.ok("Officer deleted successfully");
    }
}
