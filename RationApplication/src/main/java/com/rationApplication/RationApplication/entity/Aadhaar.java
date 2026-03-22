package com.rationApplication.RationApplication.entity;

import com.mongodb.lang.NonNull;
import com.rationApplication.RationApplication.enums.EmploymentStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection="Aadhaar")
public class Aadhaar {

    @NonNull
    @Id
    private String aadhaarNumber;

    private String name;

    private LocalDate dateOfBirth;

    private EmploymentStatus employmentStatus;

    public Aadhaar(String aadhaarNumber, String name, LocalDate dateOfBirth, String employmentStatus) {
        this.aadhaarNumber = aadhaarNumber;
        this.name = name;
        this.dateOfBirth = dateOfBirth;
        this.employmentStatus = EmploymentStatus.valueOf(employmentStatus.toUpperCase());
    }

}
