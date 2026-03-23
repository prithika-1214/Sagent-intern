package com.system.college.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import com.system.college.entity.Application;
import com.system.college.entity.Course;
import com.system.college.entity.Student;

import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import com.system.college.repository.ApplicationRepository;
import com.system.college.repository.StudentRepository;
import com.system.college.repository.CourseRepository;

@Service
public class ApplicationService {
    private static final String DEFAULT_STATUS = "Submitted";

    private final ApplicationRepository repo;
    private final StudentRepository studentRepo;
    private final CourseRepository courseRepo;

    // ✅ Single constructor (Spring will auto inject)
    public ApplicationService(ApplicationRepository repo,
                              StudentRepository studentRepo,
                              CourseRepository courseRepo) {
        this.repo = repo;
        this.studentRepo = studentRepo;
        this.courseRepo = courseRepo;
    }

    // ================= GET ALL =================
    public List<Application> getAll() {
        return repo.findAll();
    }

    public Page<Application> getAllPaged(
            int page,
            int size,
            String search,
            String status,
            Integer courseId,
            LocalDate dateFrom,
            LocalDate dateTo,
            boolean excludeDraft
    ) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.max(size, 1);
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.ASC, "appId"));

        Specification<Application> specification = buildOfficerSpecification(
                search,
                status,
                courseId,
                dateFrom,
                dateTo,
                excludeDraft
        );

        return repo.findAll(specification, pageable);
    }

    // ================= GET BY ID =================
    public Application getById(Integer id) {
        return repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));
    }

    // ================= SAVE =================
    public Application save(Application application) {

        Integer stuId = application.getStudent().getStuId();
        Integer couId = application.getCourse().getCouId();

        Student student = studentRepo.findById(stuId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        Course course = courseRepo.findById(couId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        application.setStudent(student);
        application.setCourse(course);
        if (application.getStatus() == null || application.getStatus().isBlank()) {
            application.setStatus(DEFAULT_STATUS);
        }

        return repo.save(application);
    }

    // ================= UPDATE =================
    public Application update(Integer id, Application application) {

        Application existing = getById(id);

        existing.setAddress(application.getAddress());
        existing.setPercentage(application.getPercentage());
        existing.setSubDate(application.getSubDate());
        if (application.getStatus() != null && !application.getStatus().isBlank()) {
            existing.setStatus(application.getStatus().trim());
        }

        Integer stuId = application.getStudent().getStuId();
        Integer couId = application.getCourse().getCouId();

        Student student = studentRepo.findById(stuId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        Course course = courseRepo.findById(couId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        existing.setStudent(student);
        existing.setCourse(course);

        return repo.save(existing);
    }

    // ================= DELETE =================
    public void delete(Integer id) {
        repo.deleteById(id);
    }

    private Specification<Application> buildOfficerSpecification(
            String search,
            String status,
            Integer courseId,
            LocalDate dateFrom,
            LocalDate dateTo,
            boolean excludeDraft
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            Join<Application, Student> studentJoin = root.join("student", JoinType.LEFT);
            Join<Application, Course> courseJoin = root.join("course", JoinType.LEFT);

            Expression<String> normalizedStatus =
                    cb.lower(cb.coalesce(root.get("status"), cb.literal(DEFAULT_STATUS)));

            if (excludeDraft) {
                predicates.add(cb.notEqual(normalizedStatus, "draft"));
            }

            if (hasText(status) && !"ALL".equalsIgnoreCase(status)) {
                predicates.add(cb.equal(normalizedStatus, status.trim().toLowerCase()));
            }

            if (courseId != null && courseId > 0) {
                predicates.add(cb.equal(courseJoin.get("couId"), courseId));
            }

            if (dateFrom != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("subDate"), dateFrom));
            }

            if (dateTo != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("subDate"), dateTo));
            }

            if (hasText(search)) {
                String term = search.trim();
                String likeTerm = "%" + term.toLowerCase() + "%";
                List<Predicate> searchPredicates = new ArrayList<>();

                searchPredicates.add(cb.like(cb.lower(studentJoin.get("name")), likeTerm));
                searchPredicates.add(cb.like(cb.lower(studentJoin.get("email")), likeTerm));
                searchPredicates.add(cb.like(cb.lower(courseJoin.get("couName")), likeTerm));
                searchPredicates.add(cb.like(normalizedStatus, likeTerm));

                try {
                    Integer appId = Integer.valueOf(term);
                    searchPredicates.add(cb.equal(root.get("appId"), appId));
                } catch (NumberFormatException ignored) {
                    // Non-numeric search term, skip appId exact-match predicate.
                }

                predicates.add(cb.or(searchPredicates.toArray(new Predicate[0])));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
