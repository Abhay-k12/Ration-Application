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

    @Autowired
    private EmailService emailService;

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
    public void separateMembersToNewCard(String oldCardNumber, List<String> aadhaarNumbersToTransfer, String newEmail, String stateDistrictCode, int newAnnualIncome) throws Exception {
        Beneficiary oldBeneficiary = beneficiaryRepository.findByUsername(oldCardNumber);
        if (oldBeneficiary == null) {
            throw new IllegalArgumentException("Old ration card not found");
        }

        String newCardNumber;
        String prefix = stateDistrictCode != null && stateDistrictCode.contains("-") 
                ? stateDistrictCode.split("-")[0] 
                : "RC"; 

        do {
            long randomNum = (long) (Math.random() * 9999000L) + 1000L; // 4 to 7 digits
            newCardNumber = prefix + "-" + randomNum;
        } while (beneficiaryRepository.findByUsername(newCardNumber) != null || userRepository.findByUsername(newCardNumber) != null);

        List<Aadhaar> transferringMembers = new ArrayList<>();
        for (String aadhaarStr : aadhaarNumbersToTransfer) {
            Aadhaar memberData = oldBeneficiary.getMembers().stream()
                .filter(m -> m.getAadhaarNumber().equals(aadhaarStr))
                .findFirst()
                .orElse(null);
            
            if (memberData != null) {
                transferringMembers.add(memberData);
                oldBeneficiary.getMembers().remove(memberData);
            }
        }

        if (transferringMembers.isEmpty()) {
            throw new IllegalArgumentException("No valid members found to transfer");
        }

        int remainingIncome = oldBeneficiary.getAnnualIncome() - newAnnualIncome;
        oldBeneficiary.setAnnualIncome(Math.max(remainingIncome, 0)); // Ensure it doesn't drop below 0
        beneficiaryRepository.save(oldBeneficiary); // Save old card state

        // Create New Beneficiary
        Beneficiary newBeneficiary = new Beneficiary();
        newBeneficiary.setUsername(newCardNumber);
        newBeneficiary.setEmail(newEmail);
        newBeneficiary.setFullName(transferringMembers.get(0).getName());
        newBeneficiary.setStateDistrictCode(stateDistrictCode);
        newBeneficiary.setAnnualIncome(newAnnualIncome); // Set the aggregated newly separated income
        newBeneficiary.setIsActive(true);
        newBeneficiary.setCreatedAt(System.currentTimeMillis());
        newBeneficiary.setUpdatedAt(System.currentTimeMillis());
        newBeneficiary.setMembers(transferringMembers); // Reassign members directly
        newBeneficiary.setRoles(List.of("BENEFICIARY"));
        
        // Ensure Aadhaar records persist
        for(Aadhaar m : transferringMembers) {
            aadhaarRepository.save(m);
        }
        
        beneficiaryRepository.save(newBeneficiary);

        // Create New User
        String tempPassword = "Beneficiary@123";
        String hashedPassword = passwordEncoder.encode(tempPassword);

        User newUser = new User();
        newUser.setUsername(newCardNumber);
        newUser.setPassword(hashedPassword);
        newUser.setEmail(newEmail);
        newUser.setFullName(transferringMembers.get(0).getName());
        newUser.setRoles(List.of("BENEFICIARY"));
        newUser.setStateDistrictCode(stateDistrictCode);
        newUser.setUserType("BENEFICIARY");
        newUser.setIsActive(true);
        newUser.setCreatedAt(System.currentTimeMillis());
        newUser.setUpdatedAt(System.currentTimeMillis());

        userRepository.save(newUser);

        // Email the credentials to the new beneficiary
        if (newEmail != null && !newEmail.isEmpty()) {
            String emailBody = "<p>Dear " + newBeneficiary.getFullName() + ",</p>" +
                    "<p>Your family members have been successfully separated into a new Ration Card.</p>" +
                    "<p>Your new login credentials are:</p>" +
                    "<ul><li><strong>Ration Card Number:</strong> " + newCardNumber + "</li>" +
                    "<li><strong>Password:</strong> " + tempPassword + "</li></ul>" +
                    "<p>Please log in and change your password immediately.</p>";
            
            emailService.sendEmail(newEmail, "New Ration Card Issued (Separation)", emailBody);
        }
    }

    @Transactional
    public void updateCardDetails(String cardNumber, int newIncome, String newStateDistrictCode, String newEmail) {
        Beneficiary beneficiary = beneficiaryRepository.findByUsername(cardNumber);
        if (beneficiary == null) {
            throw new IllegalArgumentException("Card not found");
        }
        User user = userRepository.findByUsername(cardNumber);
        
        beneficiary.setAnnualIncome(newIncome);
        if (newStateDistrictCode != null && !newStateDistrictCode.isEmpty()) {
            beneficiary.setStateDistrictCode(newStateDistrictCode);
            if (user != null) user.setStateDistrictCode(newStateDistrictCode);
        }
        if (newEmail != null && !newEmail.isEmpty()) {
            beneficiary.setEmail(newEmail);
            if (user != null) user.setEmail(newEmail);
        }
        
        beneficiary.setUpdatedAt(System.currentTimeMillis());
        beneficiaryRepository.save(beneficiary);
        if(user != null) userRepository.save(user);
    }

    @Transactional
    public void updateMemberDetails(String cardNumber, String aadhaarNumber, String newEmpStatus, String newPhotoBase64) {
        Beneficiary beneficiary = beneficiaryRepository.findByUsername(cardNumber);
        if (beneficiary == null) {
            throw new IllegalArgumentException("Card not found");
        }
        
        Aadhaar targetAadhaar = null;
        for (Aadhaar m : beneficiary.getMembers()) {
            if (m.getAadhaarNumber().equals(aadhaarNumber)) {
                targetAadhaar = m;
                break;
            }
        }
        
        if (targetAadhaar == null) throw new IllegalArgumentException("Member not found in card");
        
        if (newEmpStatus != null && !newEmpStatus.isEmpty()) {
            try {
                String enumStr = newEmpStatus.toUpperCase().replace("-", "_");
                targetAadhaar.setEmploymentStatus(com.rationApplication.RationApplication.enums.EmploymentStatus.valueOf(enumStr));
            } catch (Exception e) {
                throw new IllegalArgumentException("Invalid employment status");
            }
        }
        if (newPhotoBase64 != null && !newPhotoBase64.isEmpty()) targetAadhaar.setPhotograph(newPhotoBase64);
        
        aadhaarRepository.save(targetAadhaar);
        beneficiary.setUpdatedAt(System.currentTimeMillis());
        beneficiaryRepository.save(beneficiary);
    }

    @Transactional
    public void removeAndAddToExistingCard(String currentCardNumber, String targetCardNumber, String userAadhaarNumber) {
        Beneficiary oldBeneficiary = beneficiaryRepository.findByUsername(currentCardNumber);
        Beneficiary newBeneficiary = beneficiaryRepository.findByUsername(targetCardNumber);
        
        if (oldBeneficiary == null || newBeneficiary == null) {
            throw new IllegalArgumentException("Invalid card numbers provided.");
        }
        
        if (oldBeneficiary.getMembers().size() <= 1) {
            throw new IllegalArgumentException("Cannot remove the final member of a ration card. Card must be deleted entirely.");
        }

        Aadhaar transferringMember = null;
        for (Aadhaar m : oldBeneficiary.getMembers()) {
            if (m.getAadhaarNumber().equals(userAadhaarNumber)) {
                transferringMember = m;
                break;
            }
        }

        if (transferringMember == null) {
            throw new IllegalArgumentException("Member not found in source card.");
        }
        
        oldBeneficiary.getMembers().remove(transferringMember);
        newBeneficiary.getMembers().add(transferringMember);
        
        oldBeneficiary.setUpdatedAt(System.currentTimeMillis());
        newBeneficiary.setUpdatedAt(System.currentTimeMillis());
        
        beneficiaryRepository.save(oldBeneficiary);
        beneficiaryRepository.save(newBeneficiary);
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