package com.rationApplication.RationApplication.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection="AdharCard")
public class AdharCard {

    @ID
    @Indexed(unique=true)
    private String adharCardNumber;

    private String adharCardHolderName;

    private LocalDateTime dateOfBirth;

    private String stateName;

    private String districtName;
}
