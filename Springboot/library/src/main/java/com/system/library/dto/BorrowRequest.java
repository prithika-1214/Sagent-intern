package com.system.library.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.system.library.entity.BookCopy;
import com.system.library.entity.Member;

import java.time.LocalDate;

@JsonIgnoreProperties(ignoreUnknown = true)
public class BorrowRequest {

    private Integer memberId;
    private Integer copyId;
    private LocalDate issueDate;
    private LocalDate dueDate;
    private LocalDate returnDate;
    private Member member;
    private BookCopy bookCopy;

    public Integer getMemberId() {
        return memberId;
    }

    public void setMemberId(Integer memberId) {
        this.memberId = memberId;
    }

    public Integer getCopyId() {
        return copyId;
    }

    public void setCopyId(Integer copyId) {
        this.copyId = copyId;
    }

    public LocalDate getIssueDate() {
        return issueDate;
    }

    public void setIssueDate(LocalDate issueDate) {
        this.issueDate = issueDate;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public LocalDate getReturnDate() {
        return returnDate;
    }

    public void setReturnDate(LocalDate returnDate) {
        this.returnDate = returnDate;
    }

    public Member getMember() {
        return member;
    }

    public void setMember(Member member) {
        this.member = member;
    }

    public BookCopy getBookCopy() {
        return bookCopy;
    }

    public void setBookCopy(BookCopy bookCopy) {
        this.bookCopy = bookCopy;
    }
}
