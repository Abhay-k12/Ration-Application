package com.rationApplication.RationApplication.controller;

import com.rationApplication.RationApplication.entity.Complaint;
import com.rationApplication.RationApplication.service.ComplaintService;
import com.rationApplication.RationApplication.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/complaint")
@CrossOrigin(origins = "*", allowedHeaders = "*")
@Slf4j
public class ComplaintController {

    @Autowired
    private ComplaintService complaintService;

    @Autowired
    private UserService userService;


    @PostMapping("/register")
    public ResponseEntity<?> registerNewComplaint(@RequestBody Complaint complaint) {
        try {
            if (complaint == null || complaint.getApplicantUsername() == null) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Complaint applicant username is required");
                return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
            }

            complaintService.registerComplaint(complaint);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Complaint registered successfully");
            response.put("complaintId", complaint.getId());

            log.info("Complaint registered successfully for user: {}", complaint.getApplicantUsername());
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (Exception e) {
            log.error("ERROR in registering complaint: {}", e.toString(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Error registering complaint: " + e.getMessage());
            return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    @PutMapping("/resolveComplaint/{complaintId}")
    public ResponseEntity<?> resolveComplaintById(@PathVariable ObjectId complaintId, @RequestParam(defaultValue = "Resolved by admin") String resolutionNotes) {
        try {
            Complaint complaint = complaintService.getComplaintById(complaintId);

            if (complaint == null) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Complaint not found");
                return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
            }

            complaintService.resolveComplaint(complaintId, resolutionNotes);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Complaint resolved successfully");
            response.put("complaintId", complaintId);

            log.info("Complaint resolved: {} with notes: {}", complaintId, resolutionNotes);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            log.error("ERROR IN UPDATING THE STATUS TO RESOLVED: {}", e.toString(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Error resolving complaint: " + e.getMessage());
            return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    @PutMapping("/rejectComplaint/{complaintId}")
    public ResponseEntity<?> rejectComplaintById(@PathVariable ObjectId complaintId, @RequestParam(defaultValue = "Rejected by admin") String resolutionNotes) {
        try {
            Complaint complaint = complaintService.getComplaintById(complaintId);

            if (complaint == null) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Complaint not found");
                return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
            }

            complaintService.rejectComplaint(complaintId, resolutionNotes);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Complaint rejected successfully");
            response.put("complaintId", complaintId);

            log.info("Complaint rejected: {} with notes: {}", complaintId, resolutionNotes);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            log.error("ERROR IN UPDATING THE STATUS TO REJECTED: {}", e.toString(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Error rejecting complaint: " + e.getMessage());
            return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    @GetMapping("/{complaintId}")
    public ResponseEntity<?> getComplaintById(@PathVariable ObjectId complaintId) {
        try {
            Complaint complaint = complaintService.getComplaintById(complaintId);

            if (complaint == null) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Complaint not found");
                return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("complaint", complaint);

            log.info("Complaint fetched: {}", complaintId);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            log.error("ERROR IN FETCHING COMPLAINT: {}", e.toString(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Error fetching complaint: " + e.getMessage());
            return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}