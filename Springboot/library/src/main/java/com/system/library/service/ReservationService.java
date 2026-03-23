package com.system.library.service;

import com.system.library.dto.ReservationRequest;
import com.system.library.entity.Book;
import com.system.library.entity.Member;
import com.system.library.entity.Reservation;
import com.system.library.repository.BookRepository;
import com.system.library.repository.MemberRepository;
import com.system.library.repository.ReservationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@Service
public class ReservationService {

    private final ReservationRepository repo;
    private final MemberRepository memberRepository;
    private final BookRepository bookRepository;

    public ReservationService(
            ReservationRepository repo,
            MemberRepository memberRepository,
            BookRepository bookRepository
    ) {
        this.repo = repo;
        this.memberRepository = memberRepository;
        this.bookRepository = bookRepository;
    }

    @Transactional
    public Reservation save(Reservation reservation) {
        if (reservation == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reservation payload is required");
        }

        if (reservation.getMember() == null || reservation.getMember().getId() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valid member link is required");
        }

        if (reservation.getBook() == null || reservation.getBook().getId() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valid book link is required");
        }

        Member member = memberRepository.findById(reservation.getMember().getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Member not found"));
        Book book = bookRepository.findById(reservation.getBook().getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Book not found"));

        if (reservation.getReserveDate() == null) {
            reservation.setReserveDate(LocalDate.now());
        }

        if (reservation.getStatus() == null || reservation.getStatus().isBlank()) {
            reservation.setStatus("REQUESTED");
        }

        reservation.setMember(member);
        reservation.setBook(book);

        return repo.save(reservation);
    }

    @Transactional
    public Reservation create(ReservationRequest request) {
        Reservation reservation = new Reservation();
        applyRequestToReservation(reservation, request);
        return repo.save(reservation);
    }

    @Transactional
    public Reservation update(int id, ReservationRequest request) {
        Reservation existing = getById(id);
        applyRequestToReservation(existing, request);
        return repo.save(existing);
    }

    public List<Reservation> getAll() {
        return repo.findByMemberIsNotNullAndBookIsNotNull();
    }

    public Reservation getById(int id) {
        return repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found"));
    }

    public void delete(int id) {
        if (!repo.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found");
        }
        repo.deleteById(id);
    }

    private void applyRequestToReservation(Reservation reservation, ReservationRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reservation payload is required");
        }

        Integer memberId = resolveId(request.getMemberId(), request.getMember());
        Integer bookId = resolveId(request.getBookId(), request.getBook());

        if (memberId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "memberId is required");
        }
        if (bookId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "bookId is required");
        }

        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Member not found: " + memberId));
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Book not found: " + bookId));

        LocalDate reserveDate = request.getReserveDate() != null
                ? request.getReserveDate()
                : request.getReservationDate();
        if (reserveDate == null) {
            reserveDate = reservation.getReserveDate() != null ? reservation.getReserveDate() : LocalDate.now();
        }

        String status = request.getStatus();
        if (status == null || status.isBlank()) {
            status = reservation.getStatus() != null ? reservation.getStatus() : "REQUESTED";
        }

        reservation.setMember(member);
        reservation.setBook(book);
        reservation.setReserveDate(reserveDate);
        reservation.setStatus(status);
    }

    private Integer resolveId(Integer explicitId, Object nestedEntity) {
        if (explicitId != null && explicitId > 0) {
            return explicitId;
        }

        if (nestedEntity instanceof Member member && member.getId() > 0) {
            return member.getId();
        }

        if (nestedEntity instanceof Book book && book.getId() > 0) {
            return book.getId();
        }

        return null;
    }
}
