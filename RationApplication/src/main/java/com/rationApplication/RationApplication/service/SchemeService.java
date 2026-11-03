package com.rationApplication.RationApplication.service;

import com.rationApplication.RationApplication.entity.Scheme;
import com.rationApplication.RationApplication.repository.SchemeRepository;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Slf4j
public class SchemeService {

    @Autowired
    private SchemeRepository schemeRepository;


public List<Scheme> getSchemesByDistrict(String stateDistrictCode) {

    try {

        log.info("Fetching schemes for district: {}", stateDistrictCode);


        List<Scheme> schemes =
                schemeRepository.findAll();


        return schemes.stream()

                .filter(scheme ->
                        scheme.getStateDistrictCode() != null &&

                        scheme.getStateDistrictCode().equals(stateDistrictCode)
                )

                .collect(Collectors.toList());

    } catch (Exception e) {

        log.error("Error fetching schemes by district: {}", e.getMessage(), e);


        return new ArrayList<>();
    }
}

public Scheme updateScheme(String schemeId, Scheme schemeUpdates) {

    try {

        log.info("Updating scheme: {}", schemeId);


        Optional<Scheme> existingScheme =
                schemeRepository.findById(new ObjectId(schemeId));


        if (existingScheme.isPresent()) {

            Scheme scheme = existingScheme.get();


            if (schemeUpdates.getSchemeName() != null) {

                scheme.setSchemeName(schemeUpdates.getSchemeName());
            }


            if (schemeUpdates.getSchemeType() != null) {

                scheme.setSchemeType(schemeUpdates.getSchemeType());
            }


            if (schemeUpdates.getStateDistrictCode() != null) {

                scheme.setStateDistrictCode(schemeUpdates.getStateDistrictCode());
            }


            if (schemeUpdates.getSuppliesName() != null) {

                scheme.setSuppliesName(schemeUpdates.getSuppliesName());
            }


            if (schemeUpdates.getSuppliesCost() != null) {

                scheme.setSuppliesCost(schemeUpdates.getSuppliesCost());
            }


            if (schemeUpdates.getSupplyPerPerson() != null) {

                scheme.setSupplyPerPerson(schemeUpdates.getSupplyPerPerson());
            }


            Scheme updatedScheme = schemeRepository.save(scheme);


            log.info("Scheme updated: {}", schemeId);


            return updatedScheme;
        }


        log.warn("Scheme not found for update: {}", schemeId);


        return null;

    } catch (Exception e) {

        log.error("Error updating scheme: {}", e.getMessage(), e);


        throw new RuntimeException("Failed to update scheme", e);
    }
}


public boolean deleteScheme(String schemeId) {

    try {

        log.info("Deleting scheme: {}", schemeId);


        Optional<Scheme> scheme =
                schemeRepository.findById(new ObjectId(schemeId));


        if (scheme.isPresent()) {

            schemeRepository.deleteById(new ObjectId(schemeId));


            log.info("Scheme deleted: {}", schemeId);


            return true;
        }


        log.warn("Scheme not found for deletion: {}", schemeId);


        return false;

    } catch (Exception e) {

        log.error("Error deleting scheme: {}", e.getMessage(), e);


        throw new RuntimeException("Failed to delete scheme", e);
    }
}
