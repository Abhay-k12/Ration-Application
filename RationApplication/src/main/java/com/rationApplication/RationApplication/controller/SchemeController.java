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





        // Update scheme
    @PutMapping("/update/{schemeId}")
    public ResponseEntity<?> updateScheme(
            @PathVariable String schemeId,
            @RequestBody Scheme scheme) {

        try {

            String username = getCurrentUsername();


            log.info(
                    "Admin {} updating scheme: {}",
                    username,
                    schemeId
            );


            if (scheme.getSchemeName() == null
                    || scheme.getSchemeName().trim().isEmpty()) {

                Map<String, Object> errorResponse = new HashMap<>();

                errorResponse.put("success", false);

                errorResponse.put("message", "Scheme name is required");


                return new ResponseEntity<>(
                        errorResponse,
                        HttpStatus.BAD_REQUEST
                );
            }


            Scheme updatedScheme = schemeService.updateScheme(
                    schemeId,
                    scheme
            );


            if (updatedScheme == null) {

                Map<String, Object> errorResponse = new HashMap<>();

                errorResponse.put("success", false);

                errorResponse.put("message", "Scheme not found");


                return new ResponseEntity<>(
                        errorResponse,
                        HttpStatus.NOT_FOUND
                );
            }


            Map<String, Object> response = new HashMap<>();

            response.put("success", true);

            response.put("message", "Scheme updated successfully");

            response.put("scheme", updatedScheme);


            log.info(
                    "Scheme updated successfully: {} by admin {}",
                    schemeId,
                    username
            );


            return new ResponseEntity<>(
                    response,
                    HttpStatus.OK
            );


        } catch (Exception e) {

            log.error(
                    "Error updating scheme: {}",
                    e.getMessage(),
                    e
            );


            Map<String, Object> errorResponse = new HashMap<>();

            errorResponse.put("success", false);

            errorResponse.put(
                    "message",
                    "Error updating scheme: " + e.getMessage()
            );


            return new ResponseEntity<>(
                    errorResponse,
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
    
    // Delete scheme
    @DeleteMapping("/delete/{schemeId}")
    public ResponseEntity<?> deleteScheme(
            @PathVariable String schemeId) {

        try {

            String username = getCurrentUsername();


            log.info(
                    "Admin {} deleting scheme: {}",
                    username,
                    schemeId
            );


            boolean deleted = schemeService.deleteScheme(schemeId);


            if (!deleted) {

                Map<String, Object> errorResponse = new HashMap<>();

                errorResponse.put("success", false);

                errorResponse.put("message", "Scheme not found");


                return new ResponseEntity<>(
                        errorResponse,
                        HttpStatus.NOT_FOUND
                );
            }


            Map<String, Object> response = new HashMap<>();

            response.put("success", true);

            response.put("message", "Scheme deleted successfully");


            log.info(
                    "Scheme deleted successfully: {} by admin {}",
                    schemeId,
                    username
            );


            return new ResponseEntity<>(
                    response,
                    HttpStatus.OK
            );


        } catch (Exception e) {

            log.error(
                    "Error deleting scheme: {}",
                    e.getMessage(),
                    e
            );


            Map<String, Object> errorResponse = new HashMap<>();

            errorResponse.put("success", false);

            errorResponse.put(
                    "message",
                    "Error deleting scheme: " + e.getMessage()
            );


            return new ResponseEntity<>(
                    errorResponse,
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }



    // Get all schemes
    @GetMapping("/getAll")
    public ResponseEntity<?> getAllSchemes() {

        try {

            log.info("Fetching all schemes");


            List<Scheme> schemes = schemeService.getAllSchemes();


            log.info(
                    "Found {} schemes",
                    schemes.size()
            );


            return new ResponseEntity<>(
                    schemes,
                    HttpStatus.OK
            );


        } catch (Exception e) {

            log.error(
                    "Error fetching all schemes: {}",
                    e.getMessage(),
                    e
            );


            Map<String, Object> errorResponse = new HashMap<>();

            errorResponse.put("success", false);

            errorResponse.put(
                    "message",
                    "Error fetching schemes: " + e.getMessage()
            );


            return new ResponseEntity<>(
                    errorResponse,
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
