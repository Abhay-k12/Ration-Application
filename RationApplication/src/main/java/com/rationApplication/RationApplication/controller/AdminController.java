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
import org.springframework.web.bind.annotation.*;

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
        } catch (IllegalArgumentException e) {
            log.warn("Validation error adding member: {}", e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.CONFLICT);
        } catch (Exception e) {
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
    public ResponseEntity<?> getAllComplaints() {
        try {
            List<Complaint> complaints = complaintService.getAllComplaintsWithStatus(
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
}