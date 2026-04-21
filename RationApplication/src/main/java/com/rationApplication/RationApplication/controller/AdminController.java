package com.rationApplication.RationApplication.controller;

import com.rationApplication.RationApplication.entity.Aadhaar;
import com.rationApplication.RationApplication.entity.Complaint;
import com.rationApplication.RationApplication.entity.User;
import com.rationApplication.RationApplication.service.BeneficiaryService;
import com.rationApplication.RationApplication.service.ComplaintService;
import com.rationApplication.RationApplication.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.rationApplication.RationApplication.service.TransactionService;
import com.rationApplication.RationApplication.service.EmailService;
import com.rationApplication.RationApplication.repository.SchemeRepository;
import com.rationApplication.RationApplication.repository.BeneficiaryRepository;
import com.rationApplication.RationApplication.repository.UserRepository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
@CrossOrigin(origins = "*", allowedHeaders = "*")
@PreAuthorize("hasRole('ADMIN')")
@Slf4j
public class AdminController {

    @Autowired
    private UserService userService;

    @Autowired
    private BeneficiaryService beneficiaryService;

    @Autowired
    private ComplaintService complaintService;

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private SchemeRepository schemeRepository;

    @Autowired
    private BeneficiaryRepository beneficiaryRepository;

    @Autowired
    private UserRepository userRepo;

    @PutMapping("/addNewMember/{cardNumber}")
    public ResponseEntity<Map<String, Object>> addNewMember(
            @RequestBody Aadhaar aadhaar,
            @PathVariable String cardNumber) {
        try {
            beneficiaryService.addNewMemberToExistingCard(cardNumber, aadhaar);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Member added successfully");
            return new ResponseEntity<>(response, HttpStatus.OK);
        }
        catch (IllegalArgumentException e) {
            log.warn("Validation error adding member: {}", e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.CONFLICT);
        }
        catch (Exception e) {
            log.error("Error in adding new member: {}", e.toString());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error adding member");
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/separationCase/{oldCardNumber}/{newCardNumber}/{userAadhaarNumber}")
    public ResponseEntity<Map<String, Object>> migrateAadhaarFromCurrentCardToNewCard(
            @PathVariable String oldCardNumber,
            @PathVariable String newCardNumber,
            @PathVariable String userAadhaarNumber) {
        try {
            beneficiaryService.removeAndAddToNewCard(oldCardNumber, newCardNumber, userAadhaarNumber);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Aadhaar migrated successfully");
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error in separation: {}", e.toString());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error in separation: " + e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @DeleteMapping("/delete/{cardNumber}/{userAadhaarNumber}")
    public ResponseEntity<Map<String, Object>> deleteUserFromBeneficiaryCard(
            @PathVariable String cardNumber,
            @PathVariable String userAadhaarNumber) {
        try {
            beneficiaryService.removeMemberFromCard(cardNumber, userAadhaarNumber);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Member deleted successfully");
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error in deleting the user: {}", e.toString());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error deleting member: " + e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/getAllBeneficiary/{cardNumber}")
    public ResponseEntity<?> getAllBeneficiary(@PathVariable String cardNumber) {
        try {
            List<Aadhaar> members = beneficiaryService.returnAllMembers(cardNumber);
            return new ResponseEntity<>(members, HttpStatus.OK);
        } catch (Exception e) {
            log.error("ERROR IN FINDING THE MEMBERS: {}", e.toString());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Members not found: " + e.getMessage());
            return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
        }
    }

    @PostMapping("/createDistributor")
    public ResponseEntity<Map<String, Object>> createDistributor(@RequestBody User user) {
        try {
            userService.addNewDistributor(user);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Distributor created successfully");
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (Exception e) {
            log.error("ERROR IN CREATING NEW DISTRIBUTOR: {}", e.toString());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error creating distributor: " + e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/getAllComplaints")
    public ResponseEntity<?> getAllComplaints(Authentication authentication) {
        try {
            String adminUsername = authentication.getName();
            User admin = userService.getUserByUsername(adminUsername);
            
            if (admin == null || admin.getStateDistrictCode() == null) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Admin region not found");
                return new ResponseEntity<>(error, HttpStatus.FORBIDDEN);
            }

            List<Complaint> complaints = complaintService.getComplaintsByRegionAndStatus(
                    admin.getStateDistrictCode(),
                    com.rationApplication.RationApplication.enums.Status.PROCESSING);
            return new ResponseEntity<>(complaints, HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error getting complaints: {}", e.toString());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Error fetching complaints");
            return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/resolveComplaint/{complaintId}")
    public ResponseEntity<Map<String, Object>> resolveComplaint(
            @PathVariable ObjectId complaintId,
            @RequestParam String resolutionNotes) {
        try {
            complaintService.resolveComplaint(complaintId, resolutionNotes);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Complaint resolved successfully");
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error resolving complaint: {}", e.toString());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error resolving complaint");
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/rejectComplaint/{complaintId}")
    public ResponseEntity<Map<String, Object>> rejectComplaint(
            @PathVariable ObjectId complaintId,
            @RequestParam String resolutionNotes) {
        try {
            complaintService.rejectComplaint(complaintId, resolutionNotes);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Complaint rejected successfully");
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error rejecting complaint: {}", e.toString());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error rejecting complaint");
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/createNewCardFromOld")
    public ResponseEntity<Map<String, Object>> createNewCardFromOld(@RequestBody Map<String, Object> request) {
        try {
            String oldCardNumber = (String) request.get("oldCardNumber");
            String newEmail = (String) request.get("email");
            String stateDistrictCode = (String) request.get("stateDistrictCode");
            List<String> aadhaarNumbers = (List<String>) request.get("aadhaarNumbers");

            if (oldCardNumber == null || aadhaarNumbers == null || aadhaarNumbers.isEmpty()) {
                throw new IllegalArgumentException("Missing required parameters or members list");
            }

            int newAnnualIncome = 0;
            if (request.containsKey("newAnnualIncome")) {
                newAnnualIncome = Integer.parseInt(request.get("newAnnualIncome").toString());
            }

            beneficiaryService.separateMembersToNewCard(oldCardNumber, aadhaarNumbers, newEmail, stateDistrictCode, newAnnualIncome);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Members separated successfully into new card");
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (Exception e) {
            log.error("Error creating new card: {}", e.getMessage());
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return new ResponseEntity<>(err, HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/getBeneficiaryTransactions/{cardNumber}")
    public ResponseEntity<?> getBeneficiaryTransactions(@PathVariable String cardNumber) {
        try {
            var transactions = transactionService.getTransactionsByBeneficiary(cardNumber);
            return new ResponseEntity<>(transactions, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(List.of(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/getBeneficiaryComplaints/{cardNumber}")
    public ResponseEntity<?> getBeneficiaryComplaints(@PathVariable String cardNumber) {
        try {
            var complaints = complaintService.getComplaintsByUser(cardNumber);
            return new ResponseEntity<>(complaints, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(List.of(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/getAllDistributors")
    public ResponseEntity<?> getAllDistributors(Authentication authentication) {
        try {
            User admin = userService.getUserByUsername(authentication.getName());
            if (admin == null || admin.getStateDistrictCode() == null) {
                return new ResponseEntity<>(HttpStatus.FORBIDDEN);
            }
            List<User> distributors = userRepo.findByRolesContainsAndStateDistrictCode("DISTRIBUTOR", admin.getStateDistrictCode());
            return new ResponseEntity<>(distributors, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(List.of(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/sendMailToDistributor")
    public ResponseEntity<?> sendMailToDistributor(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String subject = request.get("subject");
            String body = request.get("body");

            if (email == null || subject == null || body == null) {
                throw new IllegalArgumentException("Email, Subject, and Body are required.");
            }

            emailService.sendEmail(email, subject, body);

            Map<String, Object> res = new HashMap<>();
            res.put("success", true);
            res.put("message", "Email sent successfully");
            return new ResponseEntity<>(res, HttpStatus.OK);
        } catch (Exception e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "Failed to send email");
            return new ResponseEntity<>(err, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/getDashboardStats")
    public ResponseEntity<?> getDashboardStats(Authentication authentication) {
        try {
            User admin = userService.getUserByUsername(authentication.getName());
            if (admin == null || admin.getStateDistrictCode() == null) {
                return new ResponseEntity<>(HttpStatus.FORBIDDEN);
            }
            String district = admin.getStateDistrictCode();

            long shopsCount = userRepo.countByRolesContainsAndStateDistrictCode("DISTRIBUTOR", district);
            long beneficiariesCount = beneficiaryRepository.countByStateDistrictCode(district);
            long complaintsCount = complaintService.getComplaintsByRegionAndStatus(district, com.rationApplication.RationApplication.enums.Status.PROCESSING).size();
            long schemesCount = schemeRepository.findByStateDistrictCode(district).size();

            Map<String, Long> stats = new HashMap<>();
            stats.put("totalShops", shopsCount);
            stats.put("totalBeneficiaries", beneficiariesCount);
            stats.put("pendingComplaints", complaintsCount);
            stats.put("activeSchemes", schemesCount);

            return new ResponseEntity<>(stats, HttpStatus.OK);
        } catch (Exception e) {
            log.error("Stats error: {}", e.getMessage());
            Map<String, Long> fallback = new HashMap<>();
            fallback.put("totalShops", 0L);
            fallback.put("totalBeneficiaries", 0L);
            fallback.put("pendingComplaints", 0L);
            fallback.put("activeSchemes", 0L);
            return new ResponseEntity<>(fallback, HttpStatus.OK);
        }
    }

    @GetMapping("/generateUniqueUsername")
    public ResponseEntity<Map<String, Object>> generateUniqueUsername(@RequestParam String prefix) {
        try {
            String newUsername;
            boolean isUnique = false;
            // Ensure length <= 10. Prefix length + 1 + suffix length <= 10. Prefix e.g. "UK". Wait, prefix is "UK-07" so length=5.
            // If length is 5, suffix can be 4 to 5 digits to make it <= 10.
            // Actually user specified length of numerical part is 4 to 7 digits, but total <= 10.
            // Let's generate a full username with 4 to 5 digits to be safe.
            do {
                // Generate a random number between 1000 and 99999 (4 to 5 digits)
                long randomNum = (long) (Math.random() * 90000L) + 1000L;
                newUsername = prefix + "-" + randomNum;
                if (newUsername.length() > 10) {
                    newUsername = newUsername.substring(0, 10);
                }
                
                // Need to remove trailing dash if it happens
                if(newUsername.endsWith("-")) {
                    newUsername = newUsername.substring(0, newUsername.length()-1);
                }

                if (userRepo.findByUsername(newUsername) == null && beneficiaryRepository.findByUsername(newUsername) == null) {
                    isUnique = true;
                }
            } while (!isUnique);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("username", newUsername);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error generating username: {}", e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error generating username");
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/registerBeneficiary")
    public ResponseEntity<Map<String, Object>> registerBeneficiary(@RequestBody com.rationApplication.RationApplication.entity.Beneficiary beneficiary, Authentication authentication) {
        try {
            // Get Admin's state district code
            String adminUsername = authentication.getName();
            User admin = userService.getUserByUsername(adminUsername);
            if (admin == null || admin.getStateDistrictCode() == null) {
                Map<String, Object> err = new HashMap<>();
                err.put("success", false);
                err.put("message", "Admin validation failed. No district code found.");
                return new ResponseEntity<>(err, HttpStatus.FORBIDDEN);
            }

            String districtCode = admin.getStateDistrictCode();
            String prefix = districtCode.split("-")[0]; // e.g. "UP" from "UP-12" or "UP-14"

            // Generate unique numerical part (4 to 7 digits)
            String newUsername;
            boolean isUnique = false;
            do {
                long randomNum = (long) (Math.random() * 9999000L) + 1000L; // 4 to 7 digits
                newUsername = prefix + "-" + randomNum;
                
                if (userRepo.findByUsername(newUsername) == null && beneficiaryRepository.findByUsername(newUsername) == null) {
                    isUnique = true;
                }
            } while (!isUnique);

            beneficiary.setUsername(newUsername);
            beneficiary.setStateDistrictCode(districtCode);

            beneficiaryService.addNewBeneficiaryWithUser(beneficiary);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Beneficiary registered successfully");
            response.put("username", newUsername);
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch(IllegalArgumentException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            log.error("Error registering beneficiary: {}", e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Internal server error during registration");
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/updateCardDetails/{cardNumber}")
    public ResponseEntity<Map<String, Object>> updateCardDetails(@PathVariable String cardNumber, @RequestBody Map<String, Object> body) {
        try {
            int income = body.containsKey("annualIncome") ? Integer.parseInt(body.get("annualIncome").toString()) : 0;
            String stateDistrictCode = (String) body.get("stateDistrictCode");
            String email = (String) body.get("email");
            
            beneficiaryService.updateCardDetails(cardNumber, income, stateDistrictCode, email);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Card details updated successfully");
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(Map.of("success", false, "message", e.getMessage()), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>(Map.of("success", false, "message", "Internal Server Error"), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/updateMemberDetails/{cardNumber}/{aadhaarNumber}")
    public ResponseEntity<Map<String, Object>> updateMemberDetails(@PathVariable String cardNumber, @PathVariable String aadhaarNumber, @RequestBody Map<String, Object> body) {
        try {
            String empStatus = (String) body.get("employmentStatus");
            String photo = (String) body.get("photograph");
            
            beneficiaryService.updateMemberDetails(cardNumber, aadhaarNumber, empStatus, photo);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Member updated successfully");
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(Map.of("success", false, "message", e.getMessage()), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>(Map.of("success", false, "message", "Internal Server Error"), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/transferToExistingCard/{oldCard}/{newCard}/{aadhaarNumber}")
    public ResponseEntity<Map<String, Object>> transferToExistingCard(@PathVariable String oldCard, @PathVariable String newCard, @PathVariable String aadhaarNumber) {
        try {
            beneficiaryService.removeAndAddToExistingCard(oldCard, newCard, aadhaarNumber);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Member successfully transferred to the existing card.");
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(Map.of("success", false, "message", e.getMessage()), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            log.error("Transfer member exception: ", e);
            return new ResponseEntity<>(Map.of("success", false, "message", "Internal Server Error"), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<Map<String, Object>> getAdminProfile(Authentication authentication) {
        try {
            String adminUsername = authentication.getName();
            User admin = userService.getUserByUsername(adminUsername);
            if (admin == null) {
                return new ResponseEntity<>(Map.of("success", false, "message", "Admin not found"), HttpStatus.NOT_FOUND);
            }
            Map<String, Object> profile = new HashMap<>();
            profile.put("success", true);
            profile.put("stateDistrictCode", admin.getStateDistrictCode());
            return new ResponseEntity<>(profile, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(Map.of("success", false, "message", "Error fetching profile"), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}