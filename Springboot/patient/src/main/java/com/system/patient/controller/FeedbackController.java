package com.system.patient.controller;

import com.system.patient.entity.Feedback;
import com.system.patient.service.FeedbackService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/feedback")
public class FeedbackController {

    private final FeedbackService feedbackService;

    public FeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    @PostMapping
    public Feedback create(@RequestBody Feedback feedback) {
        return feedbackService.save(feedback);
    }

    @GetMapping
    public List<Feedback> getAll() {
        return feedbackService.getAll();
    }

    @GetMapping("/{id}")
    public Feedback getById(@PathVariable Integer id) {
        return feedbackService.getById(id);
    }

    @PutMapping("/{id}")
    public Feedback update(@PathVariable Integer id, @RequestBody Feedback feedback) {
        return feedbackService.update(id, feedback);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Integer id) {
        feedbackService.delete(id);
        return "Feedback deleted successfully";
    }
}
