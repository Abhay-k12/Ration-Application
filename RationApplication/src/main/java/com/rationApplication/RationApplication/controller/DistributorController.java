package com.rationApplication.RationApplication.controller;

import com.rationApplication.RationApplication.dto.QRCodeResponse;
import com.rationApplication.RationApplication.entity.*;
import com.rationApplication.RationApplication.service.BeneficiaryService;
import com.rationApplication.RationApplication.service.ComplaintService;
import com.rationApplication.RationApplication.service.QRCodeService;
import com.rationApplication.RationApplication.service.TransactionService;
import com.rationApplication.RationApplication.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/distributor")
@PreAuthorize("hasRole('DISTRIBUTOR')")
@Slf4j
public class DistributorController {

    @Autowired
    private BeneficiaryService beneficiaryService;

    @Autowired
    private QRCodeService qrCodeService;

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private ComplaintService complaintService;

    @Autowired
    private UserService userService;

    @Autowired
    private com.rationApplication.RationApplication.service.EmailService emailService;

    private final Map<String, String> otpStore = new ConcurrentHashMap<>();

    @PostMapping("/sendOtp")
    public ResponseEntity<Map<String, Object>> sendOtp(@RequestParam String beneficiaryUsername) {
        log.info("Request to send OTP to {}", beneficiaryUsername);
        try {
            Beneficiary beneficiary = beneficiaryService.getBeneficiaryByUsername(beneficiaryUsername);
            if (beneficiary == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "Beneficiary not found");
                return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
            }
            if (beneficiary.getEmail() == null || beneficiary.getEmail().isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "No registered email found for this beneficiary");
                return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
            }
            
            String otp = String.format("%04d", new java.util.Random().nextInt(10000));
            otpStore.put(beneficiaryUsername, otp);
            
            String subject = "Smart-Ration: OTP for Ration Allocation";
            String body = "<p>Your 4-digit OTP for Ration Allocation is: <strong style='font-size:18px;'>" + otp + "</strong></p><p>Please share this with your distributor to complete the transaction.</p>";
            emailService.sendEmail(beneficiary.getEmail(), subject, body);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "OTP sent successfully to registered email");
            
            // Mask the email for response
            String email = beneficiary.getEmail();
            String maskedEmail = email.length() > 4 ? email.substring(0, 2) + "***" + email.substring(email.indexOf('@')) : "***@***";
            response.put("email", maskedEmail); 
            
            return new ResponseEntity<>(response, HttpStatus.OK);
            
        } catch (Exception e) {
             log.error("Error sending OTP: {}", e.getMessage());
             Map<String, Object> response = new HashMap<>();
             response.put("success", false);
             response.put("message", "Failed to send OTP");
             return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    @PostMapping("/verifyOtp")
    public ResponseEntity<Map<String, Object>> verifyOtp(@RequestParam String beneficiaryUsername, @RequestParam String otp) {
        try {
            String storedOtp = otpStore.get(beneficiaryUsername);
            Map<String, Object> response = new HashMap<>();
            if (storedOtp != null && storedOtp.equals(otp)) {
                otpStore.remove(beneficiaryUsername); // One time use
                
                Beneficiary beneficiary = beneficiaryService.getBeneficiaryByUsername(beneficiaryUsername);
                response.put("success", true);
                response.put("message", "OTP Verified Successfully");
                
                if (beneficiary != null) {
                   response.put("beneficiary", beneficiary); 
                }
                
                return new ResponseEntity<>(response, HttpStatus.OK);
            } else {
                response.put("success", false);
                response.put("message", "Invalid or Expired OTP");
                return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
            }
        } catch (Exception e) {
             Map<String, Object> response = new HashMap<>();
             response.put("success", false);
             response.put("message", "Failed to verify OTP");
             return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/register")
    @Transactional
    public ResponseEntity<Map<String, Object>> addNewBeneficiary(@RequestBody Beneficiary beneficiary, Authentication authentication) {
        try {
            String distributorUsername = authentication.getName();
            User distributor = userService.getUserByUsername(distributorUsername);

            if (distributor != null) {
                beneficiary.setStateDistrictCode(distributor.getStateDistrictCode());
                log.info("[REGISTER] Setting beneficiary district to: {}", distributor.getStateDistrictCode());
            }

            beneficiaryService.addNewBeneficiaryWithUser(beneficiary);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Beneficiary registered successfully");
            response.put("username", beneficiary.getUsername());
            response.put("password", "Beneficiary@123");

            log.info("[REGISTER] Beneficiary registered successfully: RC={}", beneficiary.getUsername());

            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (Exception e) {
            log.error("Error adding beneficiary: {}", e.toString());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/scanQR")
    public ResponseEntity<QRCodeResponse> scanQRCode(@RequestParam String qrData) {
        try {
            log.info("Scanning QR code");
            QRCodeResponse response = qrCodeService.scanQRCode(qrData);

            if (response.isSuccess()) {
                return new ResponseEntity<>(response, HttpStatus.OK);
            } else {
                return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
            }
        } catch (Exception e) {
            log.error("Error scanning QR: {}", e.getMessage());
            return new ResponseEntity<>(
                    new QRCodeResponse("Error scanning QR code: " + e.getMessage(), false),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/verifyBeneficiary")
    public ResponseEntity<Map<String, Object>> verifyBeneficiary(
            @RequestParam String beneficiaryUsername,  // This is rationCardNumber
            @RequestParam boolean isApproved) {
        try {
            log.info("Beneficiary verification for RC: {}", beneficiaryUsername);

            Map<String, Object> response = new HashMap<>();

            if (isApproved) {
                Beneficiary beneficiary = beneficiaryService.getBeneficiaryByUsername(beneficiaryUsername);

                if (beneficiary == null) {
                    response.put("success", false);
                    response.put("message", "Beneficiary not found");
                    return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
                }

                response.put("success", true);
                response.put("message", "Beneficiary verified successfully");
                response.put("beneficiary", beneficiary);
                response.put("verified", true);
                response.put("rationCardNumber", beneficiary.getUsername());

                return new ResponseEntity<>(response, HttpStatus.OK);
            } else {
                response.put("success", false);
                response.put("message", "Beneficiary verification rejected");
                response.put("verified", false);
                return new ResponseEntity<>(response, HttpStatus.FORBIDDEN);
            }
        } catch (Exception e) {
            log.error("Error verifying beneficiary: {}", e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error verifying beneficiary: " + e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/processTransaction")
    @Transactional
    public ResponseEntity<Map<String, Object>> processTransaction(
            @RequestParam String beneficiaryUsername,
            @RequestParam String aadhaarNumber,
            @RequestParam boolean useOthersScheme,
            Authentication authentication) {
        try {
            String distributorUsername = authentication.getName();

            log.info("[TRANSACTION] useOthersScheme: {}", useOthersScheme);

            Beneficiary beneficiary = beneficiaryService.getBeneficiaryByUsername(beneficiaryUsername);
            if (beneficiary == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "Beneficiary not found");
                return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
            }

            Transaction transaction = transactionService.processTransaction(
                    beneficiaryUsername,
                    aadhaarNumber,
                    useOthersScheme,
                    beneficiary.getStateDistrictCode(),
                    distributorUsername);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Transaction processed successfully");
            response.put("transaction", transaction);

            return new ResponseEntity<>(response, HttpStatus.OK);

        } catch (IllegalArgumentException e) {
            log.warn("Validation error: {}", e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.CONFLICT);
        } catch (Exception e) {
            log.error("Error processing transaction: {}", e.toString());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error processing transaction");
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/getComplaints")
    public ResponseEntity<List<Complaint>> getAllComplaints(Authentication authentication) {
        try {
            String username = authentication.getName();
            log.info("Getting complaints for distributor: {}", username);

            List<Complaint> complaints = complaintService.getComplaintsByUser(username);
            return new ResponseEntity<>(complaints, HttpStatus.OK);
        } catch (Exception e) {
            log.error("ERROR IN TRACKING THE COMPLAINTS: {}", e.toString());
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        }
    }

    @PostMapping("/submitComplaint")
    public ResponseEntity<Map<String, Object>> submitComplaint(
            @RequestBody Complaint complaint,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            complaint.setApplicantUsername(username);

            log.info("Submitting complaint for distributor: {}", username);
            complaintService.registerComplaint(complaint);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Complaint submitted successfully");
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (Exception e) {
            log.error("Error submitting complaint: {}", e.toString());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error submitting complaint");
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/submitBeneficiaryComplaint")
    public ResponseEntity<Map<String, Object>> submitBeneficiaryComplaint(
            @RequestBody Complaint complaint,
            @RequestParam String beneficiaryUsername,
            Authentication authentication) {
        try {
            Beneficiary beneficiary = beneficiaryService.getBeneficiaryByUsername(beneficiaryUsername);
            if (beneficiary == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "Beneficiary not found");
                return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
            }

            complaint.setApplicantUsername(beneficiaryUsername);

            log.info("Distributor {} submitting complaint on behalf of beneficiary: {}", authentication.getName(), beneficiaryUsername);
            complaintService.registerComplaint(complaint);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Complaint submitted on behalf of beneficiary successfully");
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (Exception e) {
            log.error("Error submitting beneficiary complaint: {}", e.toString());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error submitting complaint");
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}