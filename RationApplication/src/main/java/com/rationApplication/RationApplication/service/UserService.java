package com.rationApplication.RationApplication.service;

import com.rationApplication.RationApplication.entity.Complaint;
import com.rationApplication.RationApplication.entity.User;
import com.rationApplication.RationApplication.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    private static final PasswordEncoder passwordEncoder= new BCryptPasswordEncoder();

    public void addNewBeneficiaryUser(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setComplaints(new ArrayList<>());
        user.setRoles(List.of("BENEFICIARY"));
        userRepository.save(user);
    }

    public List<Complaint> getComplaints(String userId) {
        User user = userRepository.findByUsername(userId);
        return user.getComplaints();
    }

    public void changePassword(String username, String newPassword) {
        User user = userRepository.findByUsername(username);
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}
