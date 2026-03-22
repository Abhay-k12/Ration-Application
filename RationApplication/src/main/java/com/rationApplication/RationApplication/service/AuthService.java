package com.rationApplication.RationApplication.service;

import com.rationApplication.RationApplication.dto.AuthResponse;
import com.rationApplication.RationApplication.dto.RegisterRequest;
import com.rationApplication.RationApplication.dto.AadhaarRequest;
import com.rationApplication.RationApplication.entity.Aadhaar;
import com.rationApplication.RationApplication.entity.Beneficiary;
import com.rationApplication.RationApplication.entity.User;
import com.rationApplication.RationApplication.enums.EmploymentStatus;
import com.rationApplication.RationApplication.repository.AadhaarRepository;
import com.rationApplication.RationApplication.repository.BeneficiaryRepository;
import com.rationApplication.RationApplication.repository.UserRepository;
import com.rationApplication.RationApplication.security.JwtTokenProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BeneficiaryRepository beneficiaryRepository;

    @Autowired
    private AadhaarService aadhaarService;

    @Autowired
    private RationCardService rationCardService;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private AadhaarRepository aadhaarRepository;

    private static final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        try {
            // Validate input
            if (request.getUsername() == null || request.getUsername().isEmpty()) {
                return new AuthResponse("Username is required", false);
            }

            User existingUser = userRepository.findByUsername(request.getUsername());
            Beneficiary existingBeneficiary = beneficiaryRepository.findByUsername(request.getUsername());

            if (existingUser != null || existingBeneficiary != null) {
                log.warn("Username already exists: {}", request.getUsername());
                return new AuthResponse("Username already exists", false);
            }

            User user = new User();
            user.setUsername(request.getUsername());
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setEmail(request.getEmail());
            user.setRoles(request.getRoles() != null ? request.getRoles() : List.of("BENEFICIARY"));
            user.setStateDistrictCode(request.getStateDistrictCode());
            user.setComplaints(new ArrayList<>());
            user.setIsActive(true);
            user.setCreatedAt(System.currentTimeMillis());
            user.setUpdatedAt(System.currentTimeMillis());

            // If registering as BENEFICIARY
            if (request.getRoles() != null && request.getRoles().contains("BENEFICIARY")) {
                user.setUserType("BENEFICIARY");

                List<Aadhaar> members = new ArrayList<>();

                if (request.getFamilyMembers() != null && !request.getFamilyMembers().isEmpty()) {
                    log.info("Processing {} family members", request.getFamilyMembers().size());

                    for (int i = 0; i < request.getFamilyMembers().size(); i++) {
                        AadhaarRequest aadhaarRequest = request.getFamilyMembers().get(i);

                        try {
                            // Validate
                            if (aadhaarRequest == null) {
                                return new AuthResponse("Family member data is null at index " + i, false);
                            }

                            String aadhaarNumber = aadhaarRequest.getAadhaarNumber();
                            if (aadhaarNumber == null || aadhaarNumber.trim().isEmpty()) {
                                return new AuthResponse("Aadhaar number cannot be empty for member " + i, false);
                            }

                            String name = aadhaarRequest.getName();
                            if (name == null || name.trim().isEmpty()) {
                                return new AuthResponse("Name cannot be empty for member " + i, false);
                            }

                            String dateOfBirthStr = aadhaarRequest.getDateOfBirth();
                            if (dateOfBirthStr == null || dateOfBirthStr.trim().isEmpty()) {
                                return new AuthResponse("Date of birth cannot be empty for member " + i, false);
                            }

                            String employmentStatus = aadhaarRequest.getEmploymentStatus();  // ✅ GET AS STRING
                            if (employmentStatus == null || employmentStatus.trim().isEmpty()) {
                                return new AuthResponse("Employment status cannot be empty for member " + i, false);
                            }

                            try {
                                EmploymentStatus.valueOf(employmentStatus.toUpperCase());
                            } catch (IllegalArgumentException e) {
                                return new AuthResponse("Invalid employment status: " + employmentStatus + ". Valid values: GOVERNMENT, PRIVATE, STUDENT, HOUSE_WIFE, UNEMPLOYED", false);
                            }

                            LocalDate dateOfBirth = LocalDate.parse(dateOfBirthStr);

                            Aadhaar aadhaar = new Aadhaar(
                                    aadhaarNumber.trim(),
                                    name.trim(),
                                    dateOfBirth,
                                    employmentStatus.trim()
                            );

                            members.add(aadhaar);
                            log.info("Family member {} prepared: {}", i, aadhaarNumber);

                        } catch (IllegalArgumentException e) {
                            log.error("Invalid data for member {}: {}", i, e.getMessage());
                            return new AuthResponse("Invalid employment status for member " + i, false);
                        } catch (Exception e) {
                            log.error("Error processing member {}: {}", i, e.getMessage(), e);
                            return new AuthResponse("Invalid family member data at index " + i, false);
                        }
                    }
                }

                Beneficiary beneficiary = new Beneficiary();
                beneficiary.setUsername(request.getUsername());
                beneficiary.setPassword(user.getPassword());
                beneficiary.setEmail(request.getEmail());
                beneficiary.setRoles(request.getRoles());
                beneficiary.setStateDistrictCode(request.getStateDistrictCode());
                beneficiary.setAnnualIncome(request.getAnnualIncome() != null ? request.getAnnualIncome() : 0);
                beneficiary.setComplaints(new ArrayList<>());
                beneficiary.setTransactions(new ArrayList<>());
                beneficiary.setIsActive(true);
                beneficiary.setCreatedAt(System.currentTimeMillis());
                beneficiary.setUpdatedAt(System.currentTimeMillis());
                beneficiary.setMembers(members);

                userRepository.save(user);
                log.info("User saved: {}", request.getUsername());

                if (!members.isEmpty()) {
                    aadhaarRepository.saveAll(members);
                    log.info("Aadhaar members saved: {}", members.size());
                }

                beneficiaryRepository.save(beneficiary);
                log.info("Beneficiary registered: RC={}", request.getUsername());

            } else if (request.getRoles() != null && request.getRoles().contains("DISTRIBUTOR")) {
                user.setUserType("DISTRIBUTOR");
                userRepository.save(user);
            } else if (request.getRoles() != null && request.getRoles().contains("ADMIN")) {
                user.setUserType("ADMIN");
                userRepository.save(user);
            } else {
                userRepository.save(user);
            }

            String token = jwtTokenProvider.generateToken(user.getUsername(), user.getRoles());
            String refreshToken = jwtTokenProvider.generateRefreshToken(user.getUsername());

            return new AuthResponse(token, refreshToken, user.getUsername(), user.getRoles(),
                    user.getEmail(), user.getStateDistrictCode());

        } catch (Exception e) {
            log.error("Error during registration: {}", e.getMessage(), e);
            return new AuthResponse("Registration failed: " + e.getMessage(), false);
        }
    }


    public AuthResponse login(String username, String password) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password)
            );

            User user = userRepository.findByUsername(username);
            if (user == null) {
                log.warn("User not found: {}", username);
                return new AuthResponse("User not found", false);
            }

            if (!user.isUserActive()) {
                log.warn("User account is deactivated: {}", username);
                return new AuthResponse("User account is deactivated", false);
            }

            // Generate tokens
            String token = jwtTokenProvider.generateToken(user.getUsername(), user.getRoles());
            String refreshToken = jwtTokenProvider.generateRefreshToken(user.getUsername());

            log.info("User logged in successfully: {}", username);

            return new AuthResponse(token, refreshToken, user.getUsername(), user.getRoles(),
                    user.getEmail(), user.getStateDistrictCode());

        } catch (org.springframework.security.core.AuthenticationException e) {
            log.warn("Invalid credentials for user: {}", username);
            return new AuthResponse("Invalid username or password", false);
        } catch (Exception e) {
            log.error("Login failed for user: {}: {}", username, e.getMessage(), e);
            return new AuthResponse("Login failed: " + e.getMessage(), false);
        }
    }


    public AuthResponse refreshToken(String refreshToken) {
        try {
            if (refreshToken == null || refreshToken.isEmpty()) {
                return new AuthResponse("Refresh token is required", false);
            }

            if (jwtTokenProvider.validateToken(refreshToken)) {
                String username = jwtTokenProvider.getUsernameFromToken(refreshToken);
                User user = userRepository.findByUsername(username);

                if (user != null && user.isUserActive()) {
                    String newToken = jwtTokenProvider.generateToken(user.getUsername(), user.getRoles());
                    String newRefreshToken = jwtTokenProvider.generateRefreshToken(user.getUsername());

                    log.info("Token refreshed for user: {}", username);

                    return new AuthResponse(newToken, newRefreshToken, user.getUsername(), user.getRoles(),
                            user.getEmail(), user.getStateDistrictCode());
                } else {
                    log.warn("User not found or inactive: {}", username);
                    return new AuthResponse("User not found or account is inactive", false);
                }
            } else {
                log.warn("Invalid refresh token");
                return new AuthResponse("Invalid refresh token", false);
            }
        } catch (Exception e) {
            log.error("Error refreshing token: {}", e.getMessage(), e);
            return new AuthResponse("Token refresh failed: " + e.getMessage(), false);
        }
    }


    public boolean validateToken(String token) {
        try {
            if (token == null || token.isEmpty()) {
                log.warn("Token is null or empty");
                return false;
            }

            boolean isValid = jwtTokenProvider.validateToken(token);
            if (isValid) {
                log.debug("Token validated successfully");
            } else {
                log.warn("Token validation failed");
            }
            return isValid;
        } catch (Exception e) {
            log.error("Error validating token: {}", e.getMessage());
            return false;
        }
    }


    public String getUsernameFromToken(String token) {
        try {
            if (token == null || token.isEmpty()) {
                log.warn("Token is null or empty");
                return null;
            }

            String username = jwtTokenProvider.getUsernameFromToken(token);
            log.debug("Username extracted from token: {}", username);
            return username;
        } catch (Exception e) {
            log.error("Error getting username from token: {}", e.getMessage());
            return null;
        }
    }


    public User getUserByUsername(String username) {
        try {
            return userRepository.findByUsername(username);
        } catch (Exception e) {
            log.error("Error fetching user by username: {}", e.getMessage());
            return null;
        }
    }

    public boolean usernameExists(String username) {
        try {
            return userRepository.findByUsername(username) != null;
        } catch (Exception e) {
            log.error("Error checking username existence: {}", e.getMessage());
            return false;
        }
    }

    public boolean emailExists(String email) {
        try {
            List<User> allUsers = userRepository.findAll();
            for (User user : allUsers) {
                if (user.getEmail() != null && user.getEmail().equals(email)) {
                    return true;
                }
            }
            return false;
        } catch (Exception e) {
            log.error("Error checking email existence: {}", e.getMessage());
            return false;
        }
    }


    public void deactivateUser(String username) {
        try {
            User user = userRepository.findByUsername(username);
            if (user != null) {
                user.setIsActive(false);
                user.setUpdatedAt(System.currentTimeMillis());
                userRepository.save(user);
                log.info("User deactivated: {}", username);
            }
        } catch (Exception e) {
            log.error("Error deactivating user: {}", e.getMessage());
        }
    }


    public void activateUser(String username) {
        try {
            User user = userRepository.findByUsername(username);
            if (user != null) {
                user.setIsActive(true);
                user.setUpdatedAt(System.currentTimeMillis());
                userRepository.save(user);
                log.info("User activated: {}", username);
            }
        } catch (Exception e) {
            log.error("Error activating user: {}", e.getMessage());
        }
    }
}