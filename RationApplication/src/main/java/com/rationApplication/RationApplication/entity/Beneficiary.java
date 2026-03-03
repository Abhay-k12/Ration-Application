package com.rationApplication.RationApplication.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;


@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Document(collection="Beneficiary")
public class Beneficiary extends User{

    private int annualIncome;

    private String stateDistrictCode;

    private List<Aadhaar> members;
}
