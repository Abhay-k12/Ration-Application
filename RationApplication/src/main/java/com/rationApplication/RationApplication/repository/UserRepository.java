package com.rationApplication.RationApplication.repository;

import com.rationApplication.RationApplication.entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserRepository extends MongoRepository<User, String> {

    User findByUsername(String username);

    List<User> findByRoles(String role);

    @Query("{ 'stateDistrictCode': ?0, 'roles': ?1 }")
    List<User> findByRegionAndRole(String stateDistrictCode, String role);

    @Query("{ 'stateDistrictCode': ?0 }")
    List<User> findAllInRegion(String stateDistrictCode);
}