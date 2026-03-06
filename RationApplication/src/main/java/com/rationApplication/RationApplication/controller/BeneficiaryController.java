package com.rationApplication.RationApplication.controller;

import com.rationApplication.RationApplication.entity.*;
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
@RequestMapping("/beneficiary")
@Slf4j
public class BeneficiaryController {

    @Autowired
    private BeneficiaryService beneficiaryService;

    @Autowired
    private UserService userService;

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

    @GetMapping("/getTransactions/{rationCardNumber}")
    public ResponseEntity<List<Transaction>> getAllTransactions(@PathVariable String rationCardNumber) {
        try {
            List<Transaction> transactions = beneficiaryService.getTransactions(rationCardNumber);
            return new ResponseEntity<>(transactions,HttpStatus.OK);
        } catch (Exception e) {
            log.error("ERROR IN TRACKING THE TRANSACTIONS: {}", e.toString());
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

}
