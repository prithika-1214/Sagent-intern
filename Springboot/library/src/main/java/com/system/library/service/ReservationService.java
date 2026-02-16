package com.system.library.service;

import com.system.library.entity.Reservation;
import com.system.library.repository.ReservationRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReservationService {

    private final ReservationRepository repo;

    public ReservationService(ReservationRepository repo) {
        this.repo = repo;
    }

    public Reservation save(Reservation reservation) {
        return repo.save(reservation);
    }

    public List<Reservation> getAll() {
        return repo.findAll();
    }

    public Reservation getById(int id) {
        return repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));
    }

    public void delete(int id) {
        if (!repo.existsById(id)) {
            throw new RuntimeException("Reservation not found");
        }
        repo.deleteById(id);
    }
}
