package com.rationApplication.RationApplication.repository;

import com.rationApplication.RationApplication.entity.Scheme;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface SchemeRepository extends MongoRepository<Scheme, ObjectId> {
}
