package com.rationApplication.RationApplication.service;

import com.rationApplication.RationApplication.repository.BeneficiaryRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Random;

@Service
@Slf4j
public class RationCardService {

    @Autowired
    private BeneficiaryRepository beneficiaryRepository;

    private static final Random random = new Random();
    private static final int MAX_ATTEMPTS = 10;


    public String generateUniqueRationCardNumber(String stateDistrictCode) {
        String stateCode = extractStateCode(stateDistrictCode);  // UP-01 -> UP

        for (int attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            String rationCardNumber = generateRandomRationCard(stateCode);

            // Check if unique
            if (!exists(rationCardNumber)) {
                log.info("Generated unique ration card: {}", rationCardNumber);
                return rationCardNumber;
            }
        }

        throw new RuntimeException("Failed to generate unique ration card number after " + MAX_ATTEMPTS + " attempts");
    }


    private String generateRandomRationCard(String stateCode) {
        StringBuilder sb = new StringBuilder(stateCode);
        for (int i = 0; i < 8; i++) {
            sb.append(random.nextInt(10));
        }
        return sb.toString();
    }


    private boolean exists(String rationCardNumber) {
        return beneficiaryRepository.findByUsername(rationCardNumber) != null;
    }


    private String extractStateCode(String stateDistrictCode) {
        if (stateDistrictCode != null && stateDistrictCode.contains("-")) {
            return stateDistrictCode.split("-")[0];
        }
        return "XX";
    }


    public boolean validateRationCardRegion(String rationCardNumber, String stateDistrictCode) {
        String stateCode = extractStateCode(stateDistrictCode);
        return rationCardNumber.startsWith(stateCode);
    }
}