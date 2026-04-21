package com.rationApplication.RationApplication.controller;

import com.rationApplication.RationApplication.dto.QRCodeResponse;
import com.rationApplication.RationApplication.entity.Aadhaar;
import com.rationApplication.RationApplication.entity.Beneficiary;
import com.rationApplication.RationApplication.entity.Complaint;
import com.rationApplication.RationApplication.entity.Transaction;
import com.rationApplication.RationApplication.repository.BeneficiaryRepository;
import com.rationApplication.RationApplication.service.BeneficiaryService;
import com.rationApplication.RationApplication.service.ComplaintService;
import com.rationApplication.RationApplication.service.QRCodeService;
import com.rationApplication.RationApplication.service.TransactionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/beneficiary")
@CrossOrigin(origins = "*", allowedHeaders = "*")
@PreAuthorize("hasRole('BENEFICIARY')")
@Slf4j
public class BeneficiaryController {

    @Autowired
    private BeneficiaryService beneficiaryService;

    @Autowired
    private ComplaintService complaintService;

    @Autowired
    private QRCodeService qrCodeService;

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private BeneficiaryRepository beneficiaryRepository;

    @PostMapping("/generateQR")
    public ResponseEntity<QRCodeResponse> generateQRCode(Authentication authentication) {
        try {
            String username = authentication.getName();

            log.info("Generating QR code for beneficiary: {}", username);
            QRCodeResponse response = qrCodeService.generateQRCode(username, username);

            if (response.isSuccess()) {
                return new ResponseEntity<>(response, HttpStatus.OK);
            } else {
                return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
            }
        } catch (Exception e) {
            log.error("Error generating QR code: {}", e.getMessage());
            return new ResponseEntity<>(
                    new QRCodeResponse("Error generating QR code: " + e.getMessage(), false),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/getTransactions")
    public ResponseEntity<?> getAllTransactions(Authentication authentication) {
        try {
            String username = authentication.getName();
            log.info("Getting transactions for beneficiary: {}", username);

            List<Transaction> transactions = transactionService.getTransactionsByBeneficiary(username);
            return new ResponseEntity<>(transactions, HttpStatus.OK);
        } catch (Exception e) {
            log.error("ERROR IN TRACKING THE TRANSACTIONS: {}", e.toString());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Error fetching transactions");
            return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/getComplaints")
    public ResponseEntity<?> getAllComplaints(Authentication authentication) {
        try {
            String username = authentication.getName();
            log.info("Getting complaints for beneficiary: {}", username);

            List<Complaint> complaints = complaintService.getComplaintsByUser(username);
            return new ResponseEntity<>(complaints, HttpStatus.OK);
        } catch (Exception e) {
            log.error("ERROR IN TRACKING THE COMPLAINTS: {}", e.toString());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Error fetching complaints");
            return new ResponseEntity<>(error, HttpStatus.NO_CONTENT);
        }
    }

    @PostMapping("/submitComplaint")
    public ResponseEntity<Map<String, Object>> submitComplaint(
            @RequestBody Complaint complaint,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            complaint.setApplicantUsername(username);

            log.info("Submitting complaint for beneficiary: {}", username);
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

    @GetMapping("/getMembers")
    public ResponseEntity<?> getMyFamilyMembers() {
        try {
            String username = getCurrentUsername();
            log.info("Fetching family members for beneficiary: {}", username);

            Beneficiary beneficiary = beneficiaryRepository.findByUsername(username);

            if (beneficiary == null) {
                log.warn("Beneficiary not found: {}", username);
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Beneficiary not found");
                return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
            }

            List<Aadhaar> members = beneficiary.getMembers();

            if (members == null || members.isEmpty()) {
                log.info("No family members found for beneficiary: {}", username);
                return new ResponseEntity<>(new ArrayList<>(), HttpStatus.OK);
            }

            log.info("Returning {} family members for beneficiary: {}", members.size(), username);
            return new ResponseEntity<>(members, HttpStatus.OK);

        } catch (Exception e) {
            log.error("Error fetching family members: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error fetching family members: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile() {
        try {
            String username = getCurrentUsername();
            log.info("Fetching profile for beneficiary: {}", username);

            Beneficiary beneficiary = beneficiaryRepository.findByUsername(username);

            if (beneficiary == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Beneficiary not found");
                return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
            }

            return new ResponseEntity<>(beneficiary, HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error fetching beneficiary profile: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error fetching profile");
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null ? authentication.getName() : null;
    }
}

