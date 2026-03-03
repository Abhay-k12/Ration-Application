package com.rationApplication.RationApplication.repository;

import com.rationApplication.RationApplication.entity.User;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface UserRepository extends MongoRepository<String, User> {
}
