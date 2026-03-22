package com.rationApplication.RationApplication.service;

import com.rationApplication.RationApplication.entity.Aadhaar;
import com.rationApplication.RationApplication.entity.Beneficiary;
import com.rationApplication.RationApplication.entity.Transaction;
import com.rationApplication.RationApplication.repository.AadhaarRepository;
import com.rationApplication.RationApplication.repository.BeneficiaryRepository;
import com.rationApplication.RationApplication.repository.TransactionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class BeneficiaryService {

    @Autowired
    private BeneficiaryRepository beneficiaryRepository;

    @Autowired
    private AadhaarRepository aadhaarRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    private static final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public void addNewBeneficiary(Beneficiary beneficiary) {
        try {
            if (beneficiary.getUsername().isEmpty()) {
                throw new IllegalArgumentException("Username (Ration Card) is required");
            }

            Beneficiary existing = beneficiaryRepository.findByUsername(beneficiary.getUsername());
            if (existing != null) {
                throw new IllegalArgumentException("Beneficiary with this ration card already exists");
            }

            beneficiary.setCreatedAt(System.currentTimeMillis());
            beneficiary.setComplaints(new ArrayList<>());
            beneficiary.setTransactions(new ArrayList<>());

            beneficiaryRepository.save(beneficiary);
            log.info("Beneficiary added successfully: RC={}", beneficiary.getUsername());
        } catch (Exception e) {
            log.error("Error adding beneficiary: {}", e.getMessage());
            throw new RuntimeException("Failed to add beneficiary: " + e.getMessage());
        }
    }

    @Transactional
    public void removeAndAddToNewCard(String oldCardNumber, String newCardNumber,
                                      String userAadhaarNumber) throws Exception {
        removeMemberFromCard(oldCardNumber, userAadhaarNumber);

        Aadhaar aadhaar = aadhaarRepository.findByAadhaarNumber(userAadhaarNumber);
        aadhaarRepository.delete(aadhaar);

        addNewMemberToExistingCard(newCardNumber, aadhaar);
    }

    public void addNewMemberToExistingCard(String cardNumber, Aadhaar userAadhaar) throws Exception {
        try {
            Beneficiary beneficiary = beneficiaryRepository.findByUsername(cardNumber);

            if (beneficiary == null) {
                throw new IllegalArgumentException("Beneficiary with card number " + cardNumber + " not found");
            }

            // Check if Aadhaar already exists in another beneficiary
            Aadhaar existingAadhaar = aadhaarRepository.findByAadhaarNumber(userAadhaar.getAadhaarNumber());
            if (existingAadhaar != null && !existingAadhaar.getAadhaarNumber().equals(userAadhaar.getAadhaarNumber())) {
                throw new IllegalArgumentException("Aadhaar number is already linked to another ration card");
            }

            aadhaarRepository.save(userAadhaar);
            beneficiary.getMembers().add(userAadhaar);
            beneficiaryRepository.save(beneficiary);

            log.info("New member added to ration card: {}", cardNumber);
        } catch (Exception e) {
            log.error("Error adding new member: {}", e.getMessage());
            throw e;
        }
    }

    public void removeMemberFromCard(String cardNumber, String userAadhaarNumber) throws Exception {
        try {
            Beneficiary beneficiary = beneficiaryRepository.findByUsername(cardNumber);

            if (beneficiary == null) {
                throw new IllegalArgumentException("Beneficiary with card number " + cardNumber + " not found");
            }

            beneficiary.getMembers().removeIf(x -> x.getAadhaarNumber().equals(userAadhaarNumber));
            beneficiaryRepository.save(beneficiary);

            log.info("Member removed from ration card: {}", cardNumber);
        } catch (Exception e) {
            log.error("Error removing member: {}", e.getMessage());
            throw e;
        }
    }

    public List<Transaction> getTransactions(String cardNumber) throws Exception {
        try {
            Beneficiary beneficiary = beneficiaryRepository.findByUsername(cardNumber);

            if (beneficiary == null) {
                throw new IllegalArgumentException("Beneficiary with card number " + cardNumber + " not found");
            }

            return beneficiary.getTransactions();
        } catch (Exception e) {
            log.error("Error getting transactions: {}", e.getMessage());
            throw e;
        }
    }

    public List<Aadhaar> returnAllMembers(String cardNumber) throws Exception {
        try {
            Beneficiary beneficiary = beneficiaryRepository.findByUsername(cardNumber);

            if (beneficiary == null) {
                throw new IllegalArgumentException("Beneficiary with card number " + cardNumber + " not found");
            }

            return beneficiary.getMembers();
        } catch (Exception e) {
            log.error("Error getting members: {}", e.getMessage());
            throw e;
        }
    }

    public Beneficiary getBeneficiaryByUsername(String username) {
        try {
            Beneficiary beneficiary = beneficiaryRepository.findByUsername(username);

            if (beneficiary == null) {
                log.warn("Beneficiary not found for RC: {}", username);
                return null;
            }

            log.info("Beneficiary found for RC: {}", username);
            return beneficiary;
        } catch (Exception e) {
            log.error("Error fetching beneficiary by username: {}", e.getMessage());
            return null;
        }
    }
}