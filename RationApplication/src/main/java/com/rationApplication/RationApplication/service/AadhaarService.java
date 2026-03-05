package com.rationApplication.RationApplication.service;

import com.rationApplication.RationApplication.entity.Aadhaar;
import com.rationApplication.RationApplication.repository.AadhaarRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AadhaarService {

    @Autowired
    private AadhaarRepository aadhaarRepository;

    public void addNewAadhaarMember(Aadhaar aadhaar) {
        aadhaarRepository.save(aadhaar);
    }
}
