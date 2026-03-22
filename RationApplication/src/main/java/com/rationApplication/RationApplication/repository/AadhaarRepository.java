package com.rationApplication.RationApplication.repository;

import com.rationApplication.RationApplication.entity.Aadhaar;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AadhaarRepository extends MongoRepository<Aadhaar, String> {
    Aadhaar findByAadhaarNumber(String userAadhaarNumber);
}