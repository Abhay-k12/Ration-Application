package com.rationApplication.RationApplication.service;

import com.rationApplication.RationApplication.entity.Aadhaar;
import com.rationApplication.RationApplication.entity.Beneficiary;
import com.rationApplication.RationApplication.entity.Transaction;
import com.rationApplication.RationApplication.entity.User;
import com.rationApplication.RationApplication.repository.AadhaarRepository;
import com.rationApplication.RationApplication.repository.BeneficiaryRepository;
import com.rationApplication.RationApplication.repository.TransactionRepository;
import com.rationApplication.RationApplication.repository.UserRepository;
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

    @Autowired
    private UserRepository userRepository;  // NEW

    private static final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Transactional
    public void addNewBeneficiaryWithUser(Beneficiary beneficiary) {
        try {
            log.info("[BENEFICIARY] Starting beneficiary registration process");

            if (beneficiary.getUsername().isEmpty()) {
                throw new IllegalArgumentException("Username (Ration Card) is required");
            }

            if (beneficiary.getMembers() == null || beneficiary.getMembers().isEmpty()) {
                throw new IllegalArgumentException("At least one family member (head of family) is required");
            }

            Beneficiary existingBeneficiary = beneficiaryRepository.findByUsername(beneficiary.getUsername());
            if (existingBeneficiary != null) {
                log.warn("[BENEFICIARY] Ration card already exists: {}", beneficiary.getUsername());
                throw new IllegalArgumentException("Beneficiary with this ration card already exists");
            }

            User existingUser = userRepository.findByUsername(beneficiary.getUsername());
            if (existingUser != null) {
                log.warn("[BENEFICIARY] User already exists: {}", beneficiary.getUsername());
                throw new IllegalArgumentException("User with this username already exists");
            }

            log.info("[AADHAAR] Validating {} family members", beneficiary.getMembers().size());

            for (Aadhaar member : beneficiary.getMembers()) {
                if (member.getAadhaarNumber().isEmpty()) {
                    throw new IllegalArgumentException("Aadhaar number cannot be empty for member: " + member.getName());
                }

                Aadhaar existingAadhaar = aadhaarRepository.findByAadhaarNumber(member.getAadhaarNumber());
                if (existingAadhaar != null) {
                    log.warn("[AADHAAR] Aadhaar number already registered: {}", member.getAadhaarNumber());
                    throw new IllegalArgumentException(
                            "Aadhaar number " + member.getAadhaarNumber() + " is already part of another ration card. " +
                                    "This person cannot be registered twice in the system."
                    );
                }
            }

            log.info("[AADHAAR] Saving {} Aadhaar records to Aadhaar collection", beneficiary.getMembers().size());

            for (Aadhaar member : beneficiary.getMembers()) {
                aadhaarRepository.save(member);
                log.info("[AADHAAR] Saved Aadhaar: {} for member: {}", member.getAadhaarNumber(), member.getName());
            }

            beneficiary.setCreatedAt(System.currentTimeMillis());
            beneficiary.setUpdatedAt(System.currentTimeMillis());
            beneficiary.setComplaints(new ArrayList<>());
            beneficiary.setTransactions(new ArrayList<>());
            beneficiary.setIsActive(true);

            log.info("[BENEFICIARY] Saving beneficiary record: RC={}", beneficiary.getUsername());
            beneficiaryRepository.save(beneficiary);

            String tempPassword = "Beneficiary@123";
            String hashedPassword = passwordEncoder.encode(tempPassword);

            User user = new User();
            user.setUsername(beneficiary.getUsername());
            user.setPassword(hashedPassword);  // Store hashed password
            user.setEmail(beneficiary.getEmail());
            user.setFullName(beneficiary.getFullName());
            user.setRoles(beneficiary.getRoles() != null ? beneficiary.getRoles() : List.of("BENEFICIARY"));
            user.setStateDistrictCode(beneficiary.getStateDistrictCode());
            user.setUserType("BENEFICIARY");
            user.setIsActive(true);
            user.setComplaints(new ArrayList<>());
            user.setCreatedAt(System.currentTimeMillis());
            user.setUpdatedAt(System.currentTimeMillis());

            userRepository.save(user);
            log.info("[BENEFICIARY] User record created with hashed password: username={}", user.getUsername());

            log.info("[BENEFICIARY] Beneficiary registration completed successfully: RC={}", beneficiary.getUsername());

        } catch (IllegalArgumentException e) {
            log.warn("[BENEFICIARY] Validation error during registration: {}", e.getMessage());
            throw e;  // Re-throw validation errors as-is
        } catch (Exception e) {
            log.error("[BENEFICIARY] Unexpected error adding beneficiary: {}", e.getMessage(), e);
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