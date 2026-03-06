package com.rationApplication.RationApplication.controller;

import com.rationApplication.RationApplication.entity.Aadhaar;
import com.rationApplication.RationApplication.service.BeneficiaryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin")
@Slf4j
public class AdminController {

    @Autowired
    private BeneficiaryService beneficiaryService;

    @PutMapping("/addNewMember/{cardNumber}")
    public ResponseEntity<Boolean> addNewMember(@RequestBody Aadhaar aadhaar, @PathVariable String cardNumber) {
        try {
            beneficiaryService.addNewMemberToExistingCard(cardNumber, aadhaar);
            return new ResponseEntity<>(true, HttpStatus.OK);
        }
        catch(Exception e) {
            log.error("Error in adding new User: {}", e.toString());
            return new ResponseEntity<>(false, HttpStatus.NOT_ACCEPTABLE);
        }
    }

    @PutMapping("/separationCase/{oldCardNumber}/{newCardNumber}/")
    public ResponseEntity<Boolean> migrateAadhaarFromCurrentCardToNewCard(@PathVariable String oldCardNumber, @PathVariable String newCardNumber, @PathVariable String userAadhaarNumber) {
        try {
            beneficiaryService.removeAndAddToNewCard(oldCardNumber, newCardNumber, userAadhaarNumber);
            return new ResponseEntity<>(true, HttpStatus.OK);
        }
        catch(Exception e) {
            log.error("Error in separation:{}", e.toString());
            return new ResponseEntity<>(false, HttpStatus.NOT_ACCEPTABLE);
        }

    }

    @DeleteMapping("/delete/{cardNumber}/{userAadhaarNumber}")
    public ResponseEntity<Boolean> deleteUserFromBeneficiaryCard(@PathVariable String cardNumber, @PathVariable String userAadhaarNumber) {
        try {
            beneficiaryService.removeMemberFromCard(cardNumber, userAadhaarNumber);
            return new ResponseEntity<>(true,HttpStatus.OK);
        }
        catch(Exception e) {
            log.error("Error in deleting the user: {}", e.toString());
            return new ResponseEntity<>(false, HttpStatus.NOT_ACCEPTABLE);
        }
    }

    @GetMapping("/getAllBeneficiary/{cardNumber}")
    public ResponseEntity<List<Aadhaar>> getAllBeneficiary(@PathVariable String cardNumber) {
        try {
            List<Aadhaar> members = beneficiaryService.returnAllMembers(cardNumber);
            return new ResponseEntity<>(members, HttpStatus.OK);
        } catch (Exception e) {
            log.error("ERROR IN FINDING THE MEMBERS: {}", e.toString());
            return new ResponseEntity<>(HttpStatus.NOT_ACCEPTABLE);
        }
    }
}
