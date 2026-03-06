package com.rationApplication.RationApplication.service;

import com.rationApplication.RationApplication.entity.Aadhaar;
import com.rationApplication.RationApplication.entity.Beneficiary;
import com.rationApplication.RationApplication.entity.Transaction;
import com.rationApplication.RationApplication.repository.AadhaarRepository;
import com.rationApplication.RationApplication.repository.BeneficiaryRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

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

    @Transactional
    public void removeAndAddToNewCard(String oldCardNumber, String newCardNumber, String userAadhaarNumber) throws Exception {
        removeMemberFromCard(oldCardNumber, userAadhaarNumber);

        Aadhaar aadhaar = aadhaarRepository.findByAadhaarNumber(userAadhaarNumber);
        aadhaarRepository.delete(aadhaar);

        addNewMemberToExistingCard(newCardNumber, aadhaar);
    }

    public void addNewMemberToExistingCard(String cardNumber, Aadhaar userAadhaar) throws Exception{
        Beneficiary beneficiary = beneficiaryRepository.findByUsername(cardNumber);

        aadhaarRepository.save(userAadhaar);
        beneficiary.getMembers().add(userAadhaar);

        beneficiaryRepository.save(beneficiary);
    }

    public void removeMemberFromCard(String cardNumber, String userAadhaarNumber) throws Exception{
        Beneficiary beneficiary = beneficiaryRepository.findByUsername(cardNumber);

        beneficiary.getMembers().removeIf(x->x.getAadhaarNumber().equals(userAadhaarNumber));
        beneficiaryRepository.save(beneficiary);
    }

    public List<Transaction> getTransactions(String cardNumber) throws Exception {
        Beneficiary beneficiary = beneficiaryRepository.findByUsername(cardNumber);
        return beneficiary.getTransactions();
    }

    public List<Aadhaar> returnAllMembers(String cardNumber) throws Exception{
        Beneficiary beneficiary = beneficiaryRepository.findByUsername(cardNumber);
        return beneficiary.getMembers();
    }
}
