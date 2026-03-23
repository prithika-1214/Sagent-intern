package com.system.college.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.system.college.entity.AppStatus;

@Repository
public interface AppStatusRepository extends JpaRepository<AppStatus, Integer> {

}
