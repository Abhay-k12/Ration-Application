package com.rationApplication.RationApplication.controller;

import com.rationApplication.RationApplication.entity.Beneficiary;
import com.rationApplication.RationApplication.entity.User;
import com.rationApplication.RationApplication.repository.UserRepository;
import com.rationApplication.RationApplication.service.BeneficiaryService;
import com.rationApplication.RationApplication.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/beneficiary")
@Slf4j
public class BeneficiaryController {

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

}
