package com.rationApplication.RationApplication.controller;

import com.rationApplication.RationApplication.entity.Beneficiary;
import com.rationApplication.RationApplication.entity.Complaint;
import com.rationApplication.RationApplication.entity.User;
import com.rationApplication.RationApplication.service.BeneficiaryService;
import com.rationApplication.RationApplication.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/distributor")
@Slf4j
public class DistributorController {

    @Autowired
    private BeneficiaryService beneficiaryService;

    @Autowired
    private UserService userService;

    @PutMapping("/register")
    @Transactional
    public ResponseEntity<Boolean> addNewBeneficiary(@RequestBody Beneficiary beneficiary) {
        try {
            userService.addNewBeneficiaryUser(new User(beneficiary));
            beneficiaryService.addNewBeneficiary(beneficiary);
        }
        catch(Exception e) {
            log.error(e.toString());
            throw e;
        }
        return new ResponseEntity<>(true, HttpStatus.OK);
    }

    @GetMapping("/getComplaints/{userId}")
    public ResponseEntity<List<Complaint>> getAllComplaints(@PathVariable String userId) {
        try {
            List<Complaint> complaints = userService.getComplaints(userId);
            return new ResponseEntity<>(complaints, HttpStatus.OK);
        } catch (Exception e) {
            log.error("ERROR IN TRACKING THE COMPLAINTS: {}", e.toString());
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        }
    }
}
