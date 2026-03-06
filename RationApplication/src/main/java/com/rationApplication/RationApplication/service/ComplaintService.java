package com.rationApplication.RationApplication.service;

import com.rationApplication.RationApplication.entity.Complaint;
import com.rationApplication.RationApplication.entity.User;
import com.rationApplication.RationApplication.enums.Status;
import com.rationApplication.RationApplication.repository.ComplaintRepository;
import com.rationApplication.RationApplication.repository.UserRepository;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class ComplaintService {

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public void registerComplaint(Complaint complaint) {
        User user = userRepository.findByUsername(complaint.getApplicantUsername());
        user.getComplaints().add(complaint);
        userRepository.save(user);

        complaint.setStatus(Status.PROCESSING);
        complaintRepository.save(complaint);
    }

    public void resolveComplaint(ObjectId complaintId) {
        Optional<Complaint> complaint = complaintRepository.findById(complaintId);

        if(complaint.isPresent()) {
            complaint.get().setStatus(Status.RESOLVED);
            complaintRepository.save(complaint.get());
        }
    }

    public void rejectComplaint(ObjectId complaintId) {
        Optional<Complaint> complaint = complaintRepository.findById(complaintId);

        if(complaint.isPresent()) {
            complaint.get().setStatus(Status.REJECTED);
            complaintRepository.save(complaint.get());
        }
    }
}
