package com.system.patient.service;

import com.system.patient.entity.Feedback;
import com.system.patient.repository.FeedbackRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;

    public FeedbackService(FeedbackRepository feedbackRepository) {
        this.feedbackRepository = feedbackRepository;
    }

    public Feedback save(Feedback feedback) {
        return feedbackRepository.save(feedback);
    }

    public List<Feedback> getAll() {
        return feedbackRepository.findAll();
    }

    public Feedback getById(Integer id) {
        return feedbackRepository.findById(id).orElse(null);
    }

    public Feedback update(Integer id, Feedback feedback) {
        feedback.setId(id);
        return feedbackRepository.save(feedback);
    }

    public void delete(Integer id) {
        feedbackRepository.deleteById(id);
    }
}
