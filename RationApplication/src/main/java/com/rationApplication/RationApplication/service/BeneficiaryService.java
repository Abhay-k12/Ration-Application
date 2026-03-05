package com.rationApplication.RationApplication.service;

import com.rationApplication.RationApplication.entity.Aadhaar;
import com.rationApplication.RationApplication.entity.Beneficiary;
import com.rationApplication.RationApplication.repository.AadhaarRepository;
import com.rationApplication.RationApplication.repository.BeneficiaryRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class BeneficiaryService {

    @Autowired
    private BeneficiaryRepository beneficiaryRepository;

    @Autowired
    private AadhaarRepository aadhaarRepository;

    private static final PasswordEncoder passwordEncoder= new BCryptPasswordEncoder();

    public void addNewBeneficiary(Beneficiary beneficiary) {
        try {
            beneficiary.setPassword(passwordEncoder.encode(beneficiary.getPassword()));
            for(Aadhaar aadhaarEntry:beneficiary.getMembers()) { aadhaarRepository.save(aadhaarEntry);}
            beneficiaryRepository.save(beneficiary);
        } catch(Exception e) {
            log.error("ERROR IN REGISTERING USER:{}", e.toString());
            throw e;
        }
    }
}
