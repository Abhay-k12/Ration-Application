package com.rationApplication.RationApplication.repository;

import com.rationApplication.RationApplication.entity.Aadhaar;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface AadhaarRepository extends MongoRepository<String, Aadhaar> {
}
