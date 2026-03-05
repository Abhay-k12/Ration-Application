package com.rationApplication.RationApplication.controller;

import com.rationApplication.RationApplication.entity.Complaint;
import com.rationApplication.RationApplication.entity.User;
import com.rationApplication.RationApplication.service.ComplaintService;
import com.rationApplication.RationApplication.service.UserService;
import lombok.extern.slf4j.Slf4j;
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
}
