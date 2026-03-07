package com.rationApplication.RationApplication.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;


@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Document(collection="Beneficiary")
public class Beneficiary extends User{

    private int annualIncome;

    @DBRef
    private List<Aadhaar> members;

    @DBRef
    private List<Transaction> transactions;
}
