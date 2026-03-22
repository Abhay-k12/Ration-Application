package com.rationApplication.RationApplication.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.rationApplication.RationApplication.enums.EmploymentStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AadhaarRequest {

    @NotBlank(message = "Aadhaar number is required")
    @Pattern(regexp = "^[0-9]{12}$", message = "Aadhaar number must be 12 digits")
    @JsonProperty("aadhaarNumber")
    private String aadhaarNumber;

    @NotBlank(message = "Name is required")
    @JsonProperty("name")
    private String name;

    @NotBlank(message = "Date of birth is required (yyyy-MM-dd)")
    @JsonProperty("dateOfBirth")
    private String dateOfBirth;

    @NotBlank(message = "Employment status is required")
    @JsonProperty("employmentStatus")
    private String employmentStatus;

    @Override
    public String toString() {
        return "AadhaarRequest{" +
                "aadhaarNumber='" + aadhaarNumber + '\'' +
                ", name='" + name + '\'' +
                ", dateOfBirth='" + dateOfBirth + '\'' +
                ", employmentStatus='" + employmentStatus + '\'' +
                '}';
    }
}