package com.rationApplication.RationApplication.controller;

import com.rationApplication.RationApplication.entity.Scheme;
import com.rationApplication.RationApplication.enums.SchemeType;
import com.rationApplication.RationApplication.service.SchemeService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/scheme")
@Slf4j
public class SchemeController {

    @Autowired
    private SchemeService schemeService;

    // Get current username from JWT
    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null ? authentication.getName() : null;
    }

    // Create new scheme
    @PostMapping("/create")
    public ResponseEntity<?> createScheme(@RequestBody Scheme scheme) {
        try {
            String username = getCurrentUsername();
            log.info("Admin {} creating scheme: {}", username, scheme.getSchemeName());

            if (scheme.getSchemeName() == null || scheme.getSchemeName().trim().isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Scheme name is required");
                return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
            }

            if (scheme.getSchemeType() == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Scheme type is required");
                return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
            }

            if (scheme.getStateDistrictCode() == null || scheme.getStateDistrictCode().trim().isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "State/District code is required");
                return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
            }

            if (scheme.getSuppliesName() == null || scheme.getSuppliesName().isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "At least one supply is required");
                return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
            }

            Scheme createdScheme = schemeService.createScheme(scheme);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Scheme created successfully");
            response.put("scheme", createdScheme);

            log.info("Scheme created successfully: {} by admin {}", createdScheme.getId(), username);

            return new ResponseEntity<>(response, HttpStatus.CREATED);

        } catch (Exception e) {
            log.error("Error creating scheme: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error creating scheme: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Get all schemes for current district
    @GetMapping("/getByDistrict")
    public ResponseEntity<?> getSchemesByDistrict(@RequestParam String stateDistrictCode) {
        try {
            log.info("Fetching schemes for district: {}", stateDistrictCode);

            List<Scheme> schemes = schemeService.getSchemesByDistrict(stateDistrictCode);

            log.info("Found {} schemes for district: {}", schemes.size(), stateDistrictCode);

            return new ResponseEntity<>(schemes, HttpStatus.OK);

        } catch (Exception e) {
            log.error("Error fetching schemes: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error fetching schemes: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Get scheme by ID
    @GetMapping("/getById/{schemeId}")
    public ResponseEntity<?> getSchemeById(@PathVariable String schemeId) {
        try {
            log.info("Fetching scheme: {}", schemeId);

            Scheme scheme = schemeService.getSchemeById(schemeId);

            if (scheme == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Scheme not found");
                return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
            }

            return new ResponseEntity<>(scheme, HttpStatus.OK);

        } catch (Exception e) {
            log.error("Error fetching scheme: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error fetching scheme: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Update scheme
    @PutMapping("/update/{schemeId}")
    public ResponseEntity<?> updateScheme(@PathVariable String schemeId, @RequestBody Scheme scheme) {
        try {
            String username = getCurrentUsername();
            log.info("Admin {} updating scheme: {}", username, schemeId);

            if (scheme.getSchemeName() == null || scheme.getSchemeName().trim().isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Scheme name is required");
                return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
            }

            Scheme updatedScheme = schemeService.updateScheme(schemeId, scheme);

            if (updatedScheme == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Scheme not found");
                return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Scheme updated successfully");
            response.put("scheme", updatedScheme);

            log.info("Scheme updated successfully: {} by admin {}", schemeId, username);

            return new ResponseEntity<>(response, HttpStatus.OK);

        } catch (Exception e) {
            log.error("Error updating scheme: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error updating scheme: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

