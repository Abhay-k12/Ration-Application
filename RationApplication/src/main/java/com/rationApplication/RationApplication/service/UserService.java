package com.rationApplication.RationApplication.service;

import com.rationApplication.RationApplication.entity.Complaint;
import com.rationApplication.RationApplication.entity.User;
import com.rationApplication.RationApplication.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class UserService {

    @Autowired
    private UserRepository userRepository;

    private static final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public void addNewBeneficiaryUser(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setComplaints(new ArrayList<>());
        user.setRoles(List.of("BENEFICIARY"));
        user.setCreatedAt(System.currentTimeMillis());
        userRepository.save(user);
    }

    public List<Complaint> getComplaints(String userId) {
        User user = userRepository.findByUsername(userId);
        if (user != null) {
            return user.getComplaints();
        }
        return new ArrayList<>();
    }

    public void changePassword(String username, String newPassword) {
        User user = userRepository.findByUsername(username);
        if (user != null) {
            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);
        }
    }

    public void addNewDistributor(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRoles(List.of("DISTRIBUTOR"));
        user.setComplaints(new ArrayList<>());
        user.setCreatedAt(System.currentTimeMillis());
        userRepository.save(user);
        log.info("Distributor created in region: {}", user.getStateDistrictCode());
    }


    public List<User> getUsersByRegion(String stateDistrictCode) {
        return userRepository.findAllInRegion(stateDistrictCode);
    }


    public List<User> getDistributorsByRegion(String stateDistrictCode) {
        return userRepository.findByRegionAndRole(stateDistrictCode, "DISTRIBUTOR");
    }


    public boolean verifyUserRegion(String username, String stateDistrictCode) {
        User user = userRepository.findByUsername(username);
        return user != null && user.getStateDistrictCode().equals(stateDistrictCode);
    }
}