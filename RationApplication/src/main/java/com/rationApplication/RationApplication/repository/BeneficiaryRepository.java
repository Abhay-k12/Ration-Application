package com.rationApplication.RationApplication.repository;

import com.rationApplication.RationApplication.entity.Beneficiary;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface BeneficiaryRepository extends MongoRepository<String, Beneficiary> {
}
