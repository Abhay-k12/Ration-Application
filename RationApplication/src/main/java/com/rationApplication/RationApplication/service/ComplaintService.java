package com.rationApplication.RationApplication.service;

import com.rationApplication.RationApplication.entity.Complaint;
import com.rationApplication.RationApplication.entity.User;
import com.rationApplication.RationApplication.enums.Status;
import com.rationApplication.RationApplication.repository.ComplaintRepository;
import com.rationApplication.RationApplication.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class ComplaintService {

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @Transactional
    public void registerComplaint(Complaint complaint) {
        complaint.setStatus(Status.PROCESSING);
        complaint.setCreatedAt(System.currentTimeMillis());

        User user = userRepository.findByUsername(complaint.getApplicantUsername());
        if (user != null) {
            complaint.setStateDistrictCode(user.getStateDistrictCode());
        }

        Complaint savedComplaint = complaintRepository.save(complaint);

        if (user != null) {
            user.addComplaint(savedComplaint);
            userRepository.save(user);
            
            if (user.getEmail() != null && !user.getEmail().isEmpty()) {
                String emailBody = "<p>Dear " + user.getUsername() + ",</p>" +
                        "<p>Your complaint regarding <strong>" + complaint.getComplaintTitle() + "</strong> has been successfully registered.</p>" +
                        "<p>It is currently under <strong style='color: #ca8a04;'>PROCESSING</strong> by your District Administrator.</p>";
                emailService.sendEmail(user.getEmail(), "Complaint Registered Successfully", emailBody);
            }
        }

        log.info("Complaint registered in region: {}", savedComplaint.getStateDistrictCode());
    }

    public void resolveComplaint(ObjectId complaintId, String resolutionNotes) {
        Optional<Complaint> complaint = complaintRepository.findById(complaintId);

        if (complaint.isPresent()) {
            Complaint c = complaint.get();
            c.setStatus(Status.RESOLVED);
            c.setResolutionNotes(resolutionNotes);
            c.setResolvedAt(System.currentTimeMillis());
            complaintRepository.save(c);
            
            User user = userRepository.findByUsername(c.getApplicantUsername());
            if (user != null && user.getEmail() != null && !user.getEmail().isEmpty()) {
                String emailBody = "<p>Dear " + user.getUsername() + ",</p>" +
                        "<div class='alert-box' style='border-left: 4px solid #16a34a; background: #f0fdf4;'>" +
                        "<p>Your complaint regarding <strong>" + c.getComplaintTitle() + "</strong> has been <strong style='color: #16a34a;'>RESOLVED</strong>.</p>" +
                        "</div>" +
                        "<p><strong>Administrator Notes:</strong> " + resolutionNotes + "</p>";
                emailService.sendEmail(user.getEmail(), "Update: Complaint Resolved", emailBody);
            }
        }
    }

    public void rejectComplaint(ObjectId complaintId, String resolutionNotes) {
        Optional<Complaint> complaint = complaintRepository.findById(complaintId);

        if (complaint.isPresent()) {
            Complaint c = complaint.get();
            c.setStatus(Status.REJECTED);
            c.setResolutionNotes(resolutionNotes);
            c.setResolvedAt(System.currentTimeMillis());
            complaintRepository.save(c);
            
            User user = userRepository.findByUsername(c.getApplicantUsername());
            if (user != null && user.getEmail() != null && !user.getEmail().isEmpty()) {
                String emailBody = "<p>Dear " + user.getUsername() + ",</p>" +
                        "<div class='alert-box' style='border-left: 4px solid #dc2626; background: #fef2f2;'>" +
                        "<p>Your complaint regarding <strong>" + c.getComplaintTitle() + "</strong> has been <strong style='color: #dc2626;'>REJECTED</strong>.</p>" +
                        "</div>" +
                        "<p><strong>Administrator Notes:</strong> " + resolutionNotes + "</p>";
                emailService.sendEmail(user.getEmail(), "Update: Complaint Rejected", emailBody);
            }
        }
    }

    public Complaint getComplaintById(ObjectId complaintId) {
        return complaintRepository.findById(complaintId).orElse(null);
    }

    public List<Complaint> getComplaintsByUser(String username) {
        return complaintRepository.findByApplicantUsername(username);
    }


    public List<Complaint> getComplaintsByRegion(String stateDistrictCode) {
        return complaintRepository.findComplaintsByRegion(stateDistrictCode);
    }


    public List<Complaint> getComplaintsByRegionAndStatus(String stateDistrictCode, Status status) {
        return complaintRepository.findByRegionAndStatus(stateDistrictCode, status);
    }


    public List<Complaint> getAllComplaintsWithStatus(Status status) {
        return complaintRepository.findByStatus(status);
    }
}