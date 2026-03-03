package com.rationApplication.RationApplication.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "Transaction")
public class Transaction {

    @Id
    private ObjectId id;

    private Beneficiary beneficiary;

    private Aadhaar beneficiaryDetails;

    private float totalAmountPaid;

    private LocalDateTime dateOfTransaction;

    private Scheme scheme;
}
