package com.rationApplication.RationApplication.controller;

import com.rationApplication.RationApplication.dto.AuthRequest;
import com.rationApplication.RationApplication.dto.AuthResponse;
import com.rationApplication.RationApplication.dto.RegisterRequest;
import com.rationApplication.RationApplication.entity.User;
import com.rationApplication.RationApplication.service.AuthService;
import com.rationApplication.RationApplication.service.EmailService;
import com.rationApplication.RationApplication.service.OTPService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*", allowedHeaders = "*")
@Slf4j
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private OTPService otpService;

    @Autowired
    private EmailService emailService;


    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest registerRequest) {
        try {
            log.info("Registering new user: {}", registerRequest.getUsername());

            if (registerRequest.getUsername() == null || registerRequest.getUsername().trim().isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Username is required");
                return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
            }

            if (registerRequest.getPassword() == null || registerRequest.getPassword().trim().isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Password is required");
                return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
            }

            if (registerRequest.getEmail() == null || registerRequest.getEmail().trim().isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Email is required");
                return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
            }

            if (registerRequest.getStateDistrictCode() == null || registerRequest.getStateDistrictCode().trim().isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "State/District Code is required");
                return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
            }

            AuthResponse response = authService.register(registerRequest);

            if (response.isSuccess()) {
                return new ResponseEntity<>(response, HttpStatus.CREATED);
            } else {
                return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
            }
        } catch (IllegalArgumentException e) {
            log.warn("Validation error in registration: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            log.error("Error in registration: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Registration failed: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequest authRequest) {
        try {
            log.info("User login attempt: {}", authRequest.getUsername());

            if (authRequest.getUsername() == null || authRequest.getUsername().trim().isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Username is required");
                return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
            }

            if (authRequest.getPassword() == null || authRequest.getPassword().trim().isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Password is required");
                return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
            }

            AuthResponse response = authService.login(authRequest.getUsername(), authRequest.getPassword());

            if (response.isSuccess()) {
                log.info("User logged in successfully: {}", authRequest.getUsername());

                // Log the roles being returned
                log.info("Roles in response: {}", response.getRoles());

                return new ResponseEntity<>(response, HttpStatus.OK);
            } else {
                log.warn("Login failed for user: {}", authRequest.getUsername());
                return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
            }
        }
        catch (Exception e) {
            log.error("Error in login: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Login failed: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            // Validate header
            if (authHeader == null || authHeader.trim().isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Authorization header is required");
                return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
            }

            // Extract token
            if (!authHeader.startsWith("Bearer ")) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Invalid authorization header format. Use 'Bearer <token>'");
                return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
            }

            String refreshToken = authHeader.substring(7);  // Remove "Bearer " prefix

            log.info("Token refresh request");
            AuthResponse response = authService.refreshToken(refreshToken);

            if (response.isSuccess()) {
                log.info("Token refreshed successfully");
                return new ResponseEntity<>(response, HttpStatus.OK);
            } else {
                log.warn("Token refresh failed");
                return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
            }
        } catch (Exception e) {
            log.error("Error refreshing token: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Token refresh failed: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    @GetMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            if (authHeader == null || authHeader.trim().isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Authorization header is required");
                return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
            }

            if (!authHeader.startsWith("Bearer ")) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Invalid authorization header format");
                return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
            }

            String token = authHeader.substring(7);
            boolean isValid = authService.validateToken(token);

            Map<String, Object> response = new HashMap<>();
            response.put("success", isValid);
            response.put("message", isValid ? "Token is valid" : "Token is invalid");

            if (isValid) {
                return new ResponseEntity<>(response, HttpStatus.OK);
            } else {
                return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
            }
        } catch (Exception e) {
            log.error("Error validating token: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Token validation failed: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/forgot-password/request")
    public ResponseEntity<?> requestPasswordReset(@RequestBody Map<String, String> request) {
        try {
            String username = request.get("username");
            if (username == null || username.trim().isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Username is required to proceed.");
                return new ResponseEntity<>(errorResponse, HttpStatus.OK);
            }

            User user = authService.getUserByUsername(username);
            if (user == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "We couldn't find an account with that username. Please verify and try again.");
                return new ResponseEntity<>(errorResponse, HttpStatus.OK);
            }

            if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "No registered email address found for this account. Please contact an administrator.");
                return new ResponseEntity<>(errorResponse, HttpStatus.OK);
            }

            String otp = otpService.generateOTP(username);
            String subject = "Password Reset OTP - Smart-Ration";
            String body = "<p>Dear " + (user.getFullName() != null ? user.getFullName() : username) + ",</p>" +
                    "<p>You have requested to reset your password. Please use the following OTP to proceed:</p>" +
                    "<div class='alert-box' style='font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px;'>" + otp + "</div>" +
                    "<p>If you did not request this, please ignore this email.</p>";
            
            emailService.sendEmail(user.getEmail(), subject, body);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "OTP sent to registered email");
            return new ResponseEntity<>(response, HttpStatus.OK);
            
        } catch (Exception e) {
            log.error("Error requesting password reset: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Failed to process request: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/forgot-password/verify")
    public ResponseEntity<?> verifyPasswordReset(@RequestBody Map<String, String> request) {
        try {
            String username = request.get("username");
            String otp = request.get("otp");

            if (username == null || username.trim().isEmpty() || otp == null || otp.trim().isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Username and OTP are required.");
                return new ResponseEntity<>(errorResponse, HttpStatus.OK);
            }

            boolean isValid = otpService.validateOTP(username, otp);
            if (!isValid) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Invalid or expired OTP. Please check the code and try again.");
                return new ResponseEntity<>(errorResponse, HttpStatus.OK);
            }

            // OTP valid, reset password
            String tempPassword = "User@123";
            boolean isReset = authService.resetPassword(username, tempPassword);

            if (isReset) {
                User user = authService.getUserByUsername(username);
                String subject = "Password Successfully Reset - Smart-Ration";
                String body = "<p>Dear " + (user.getFullName() != null ? user.getFullName() : username) + ",</p>" +
                        "<p>Your password has been successfully reset.</p>" +
                        "<p>Your temporary password is: <strong style='font-size: 18px;'>" + tempPassword + "</strong></p>" +
                        "<div class='alert-box'><strong>Important:</strong> Please log in and change your password immediately.</div>";
                
                emailService.sendEmail(user.getEmail(), subject, body);

                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Password reset successfully");
                return new ResponseEntity<>(response, HttpStatus.OK);
            } else {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Failed to reset password in database");
                return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
            }

        } catch (Exception e) {
            log.error("Error verifying password reset: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Failed to process verification: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}