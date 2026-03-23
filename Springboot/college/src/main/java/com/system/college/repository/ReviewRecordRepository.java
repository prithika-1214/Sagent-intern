package com.system.college.repository;

import com.system.college.entity.ReviewRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReviewRecordRepository extends JpaRepository<ReviewRecord, Integer> {

}
