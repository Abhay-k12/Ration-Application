package com.rationApplication.RationApplication.repository;

import com.rationApplication.RationApplication.entity.Beneficiary;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BeneficiaryRepository extends MongoRepository<Beneficiary, String> {

    Beneficiary findByUsername(String username);

    @Query("{ 'username': ?0 }")
    Beneficiary findByRationCardNumber(String rationCardNumber);

    List<Beneficiary> findByStateDistrictCode(String stateDistrictCode);

    @Query("{ 'stateDistrictCode': ?0 }")
    List<Beneficiary> findAllInRegion(String stateDistrictCode);
}