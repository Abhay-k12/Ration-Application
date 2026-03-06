package com.rationApplication.RationApplication.controller;

import com.rationApplication.RationApplication.entity.Complaint;
import com.rationApplication.RationApplication.entity.User;
import com.rationApplication.RationApplication.service.ComplaintService;
import com.rationApplication.RationApplication.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/complaint")
@Slf4j
public class ComplaintController {

    @Autowired
    private ComplaintService complaintService;

    @Autowired
    private UserService userService;

    @PostMapping("/register")
    public ResponseEntity<Boolean> registerNewComplaint(@RequestBody Complaint complaint) {
        try {
            complaintService.registerComplaint(complaint);
            return new ResponseEntity<>(true, HttpStatus.OK);
        }
        catch(Exception e) {
            log.error("ERROR in registering complaint: {}",e.toString());
            return new ResponseEntity<>(false, HttpStatus.NOT_ACCEPTABLE);
        }
    }

    @PutMapping("/resolveComplaint/{complaintId}")
    public ResponseEntity<Boolean> resolveComplaintById(@PathVariable ObjectId complaintId) {
        try {
            complaintService.resolveComplaint(complaintId);
        } catch (Exception e) {
            log.error("ERROR IN UPDATING THE STATUS To RESOLVED: {}", e.toString());
            return new ResponseEntity<>(false, HttpStatus.NOT_ACCEPTABLE);
        }

        return new ResponseEntity<>(true, HttpStatus.OK);
    }

    @PutMapping("rejectComplaint/{complaintId}")
    public ResponseEntity<Boolean> rejectComplaintBuyId(@PathVariable ObjectId complaintId) {
        try {
            complaintService.rejectComplaint(complaintId);
        } catch (Exception e) {
            log.error("ERROR IN UPDATING THE STATUS TO REJECTING: {}", e.toString());
            return new ResponseEntity<>(false, HttpStatus.NOT_ACCEPTABLE);
        }

        return new ResponseEntity<>(true, HttpStatus.OK);
    }
}
