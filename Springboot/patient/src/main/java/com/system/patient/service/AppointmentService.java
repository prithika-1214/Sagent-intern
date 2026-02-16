package com.system.patient.service;

import com.system.patient.entity.Appointment;
import com.system.patient.repository.AppointmentRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;

    public AppointmentService(AppointmentRepository appointmentRepository) {
        this.appointmentRepository = appointmentRepository;
    }

    public Appointment save(Appointment appointment) {
        return appointmentRepository.save(appointment);
    }

    public List<Appointment> getAll() {
        return appointmentRepository.findAll();
    }

    public Appointment getById(Integer id) {
        return appointmentRepository.findById(id).orElse(null);
    }

    public Appointment update(Integer id, Appointment appointment) {
        appointment.setId(id);
        return appointmentRepository.save(appointment);
    }

    public void delete(Integer id) {
        appointmentRepository.deleteById(id);
    }
}
