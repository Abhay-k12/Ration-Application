package com.rationApplication.RationApplication.repository;

import com.rationApplication.RationApplication.entity.Scheme;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface SchemeRepository extends MongoRepository<Scheme, ObjectId> {
    List<Scheme> findByStateDistrictCode(String stateDistrictCode);
}
