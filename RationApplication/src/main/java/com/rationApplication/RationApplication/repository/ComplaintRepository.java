package com.rationApplication.RationApplication.repository;

import com.rationApplication.RationApplication.entity.Complaint;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ComplaintRepository extends MongoRepository<Complaint, ObjectId> {
}
