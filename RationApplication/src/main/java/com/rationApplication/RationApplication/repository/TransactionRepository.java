package com.rationApplication.RationApplication.repository;

import com.rationApplication.RationApplication.entity.Transaction;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface TransactionRepository extends MongoRepository<Transaction,ObjectId> {
}
