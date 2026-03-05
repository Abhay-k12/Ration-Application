package com.rationApplication.RationApplication.service;

import com.rationApplication.RationApplication.entity.Complaint;
import com.rationApplication.RationApplication.entity.User;
import com.rationApplication.RationApplication.repository.ComplaintRepository;
import com.rationApplication.RationApplication.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ComplaintService {

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public void registerComplaint(Complaint complaint) {
        User user = userRepository.findUserByUsername(complaint.getApplicantUsername());
        user.getComplaints().add(complaint);

        userRepository.save(user);
        complaintRepository.save(complaint);
    }
}
