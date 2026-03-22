package com.rationApplication.RationApplication.service;

import com.rationApplication.RationApplication.entity.Aadhaar;
import com.rationApplication.RationApplication.repository.AadhaarRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;

@Service
public class AadhaarService {

    @Autowired
    private AadhaarRepository aadhaarRepository;

    public void addNewAadhaarMember(Aadhaar aadhaar) {
        aadhaarRepository.save(aadhaar);
    }


    public Aadhaar findByAadhaarNumber(@NotBlank(message = "Aadhaar number is required") @Pattern(regexp = "^[0-9]{12}$", message = "Aadhaar number must be 12 digits") String aadhaarNumber) {
        return aadhaarRepository.findByAadhaarNumber(aadhaarNumber);
    }
}
