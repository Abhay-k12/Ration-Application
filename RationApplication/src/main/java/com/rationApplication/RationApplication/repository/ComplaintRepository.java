package com.rationApplication.RationApplication.repository;

import com.rationApplication.RationApplication.entity.Complaint;
import com.rationApplication.RationApplication.enums.Status;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComplaintRepository extends MongoRepository<Complaint, ObjectId> {

    List<Complaint> findByStatus(Status status);

    List<Complaint> findByApplicantUsername(String applicantUsername);

    @Query("{ 'stateDistrictCode': ?0 }")
    List<Complaint> findComplaintsByRegion(String stateDistrictCode);

    @Query("{ 'stateDistrictCode': ?0, 'status': ?1 }")
    List<Complaint> findByRegionAndStatus(String stateDistrictCode, Status status);

    @Query("{ 'applicantUsername': ?0 }")
    List<Complaint> findComplaintsByApplicant(String applicantUsername);

    @Query("{ 'applicantUsername': ?0, 'stateDistrictCode': ?1 }")
    List<Complaint> findByApplicantAndRegion(String applicantUsername, String stateDistrictCode);

    @Query("{ 'applicantUsername': ?0, 'stateDistrictCode': ?1, 'status': ?2 }")
    List<Complaint> findByApplicantRegionAndStatus(String applicantUsername, String stateDistrictCode, Status status);

    @Query("{ }")
    List<Complaint> findAllComplaints();

    @Query("{ 'stateDistrictCode': ?0 }")
    long countByRegion(String stateDistrictCode);

    @Query("{ 'stateDistrictCode': ?0, 'status': ?1 }")
    long countByRegionAndStatus(String stateDistrictCode, Status status);
}