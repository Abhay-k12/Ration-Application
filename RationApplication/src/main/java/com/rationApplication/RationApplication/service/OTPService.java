package com.rationApplication.RationApplication.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class OTPService {

    // Store OTPs mapped to usernames
    // In a production environment, this should ideally be in Redis with a TTL.
    private final Map<String, String> otpStorage = new ConcurrentHashMap<>();
    private final Random random = new Random();

    public String generateOTP(String username) {
        // Generate a 6-digit random OTP
        String otp = String.format("%06d", random.nextInt(1000000));
        otpStorage.put(username, otp);
        log.info("OTP generated for user: {}", username);
        return otp;
    }

    public boolean validateOTP(String username, String otp) {
        if (username == null || otp == null) {
            return false;
        }
        
        String storedOtp = otpStorage.get(username);
        if (storedOtp != null && storedOtp.equals(otp)) {
            // OTP is valid, clear it
            otpStorage.remove(username);
            log.info("OTP validated successfully for user: {}", username);
            return true;
        }
        log.warn("Invalid OTP attempt for user: {}", username);
        return false;
    }
    
    public void clearOTP(String username) {
        otpStorage.remove(username);
    }
}
