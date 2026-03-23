package com.system.library.service;

import com.system.library.dto.BorrowRequest;
import com.system.library.entity.BookCopy;
import com.system.library.entity.Borrow;
import com.system.library.entity.Member;
import com.system.library.repository.BookCopyRepository;
import com.system.library.repository.MemberRepository;
import com.system.library.repository.BorrowRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@Service
public class BorrowService {

    private final BorrowRepository repo;
    private final MemberRepository memberRepository;
    private final BookCopyRepository bookCopyRepository;

    public BorrowService(
            BorrowRepository repo,
            MemberRepository memberRepository,
            BookCopyRepository bookCopyRepository
    ) {
        this.repo = repo;
        this.memberRepository = memberRepository;
        this.bookCopyRepository = bookCopyRepository;
    }

    @Transactional
    public Borrow save(Borrow borrow) {
        if (borrow == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Borrow payload is required");
        }

        if (borrow.getMember() == null || borrow.getMember().getId() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valid member link is required");
        }

        if (borrow.getBookCopy() == null || borrow.getBookCopy().getId() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valid copy link is required");
        }

        Member member = memberRepository.findById(borrow.getMember().getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Member not found"));
        BookCopy copy = bookCopyRepository.findById(borrow.getBookCopy().getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Book copy not found"));

        if (borrow.getIssueDate() == null) {
            borrow.setIssueDate(LocalDate.now());
        }

        if (borrow.getDueDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "dueDate is required");
        }

        borrow.setMember(member);
        borrow.setBookCopy(copy);

        return repo.save(borrow);
    }

    @Transactional
    public Borrow create(BorrowRequest request) {
        Borrow borrow = new Borrow();
        applyRequestToBorrow(borrow, request);
        return repo.save(borrow);
    }

    @Transactional
    public Borrow update(int id, BorrowRequest request) {
        Borrow existing = getById(id);
        applyRequestToBorrow(existing, request);
        return repo.save(existing);
    }

    public List<Borrow> getAll() {
        return repo.findByMemberIsNotNullAndBookCopyIsNotNull();
    }

    public Borrow getById(int id) {
        return repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Borrow not found"));
    }

    public void delete(int id) {
        if (!repo.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Borrow not found");
        }
        repo.deleteById(id);
    }

    private void applyRequestToBorrow(Borrow borrow, BorrowRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Borrow payload is required");
        }

        Integer memberId = resolveMemberId(request);
        Integer copyId = resolveCopyId(request);

        if (memberId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "memberId is required");
        }
        if (copyId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "copyId is required");
        }

        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Member not found: " + memberId));
        BookCopy copy = bookCopyRepository.findById(copyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Book copy not found: " + copyId));

        LocalDate issueDate = request.getIssueDate();
        if (issueDate == null) {
            issueDate = borrow.getIssueDate() != null ? borrow.getIssueDate() : LocalDate.now();
        }

        LocalDate dueDate = request.getDueDate();
        if (dueDate == null) {
            dueDate = borrow.getDueDate();
        }
        if (dueDate == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "dueDate is required");
        }

        LocalDate returnDate = request.getReturnDate() != null ? request.getReturnDate() : borrow.getReturnDate();

        borrow.setMember(member);
        borrow.setBookCopy(copy);
        borrow.setIssueDate(issueDate);
        borrow.setDueDate(dueDate);
        borrow.setReturnDate(returnDate);
    }

    private Integer resolveMemberId(BorrowRequest request) {
        if (request.getMemberId() != null && request.getMemberId() > 0) {
            return request.getMemberId();
        }

        if (request.getMember() != null && request.getMember().getId() > 0) {
            return request.getMember().getId();
        }

        return null;
    }

    private Integer resolveCopyId(BorrowRequest request) {
        if (request.getCopyId() != null && request.getCopyId() > 0) {
            return request.getCopyId();
        }

        if (request.getBookCopy() != null && request.getBookCopy().getId() > 0) {
            return request.getBookCopy().getId();
        }

        return null;
    }
}
