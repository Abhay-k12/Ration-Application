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

    @Transactional
    public void registerComplaint(Complaint complaint) {
        User user = userRepository.findByUsername(complaint.getApplicantUsername());
        if (user != null) {
            user.getComplaints().add(complaint);
            complaint.setStateDistrictCode(user.getStateDistrictCode());
            userRepository.save(user);
        }

        complaint.setStatus(Status.PROCESSING);
        complaint.setCreatedAt(System.currentTimeMillis());
        complaintRepository.save(complaint);
        log.info("Complaint registered in region: {}", complaint.getStateDistrictCode());
    }

    public void resolveComplaint(ObjectId complaintId, String resolutionNotes) {
        Optional<Complaint> complaint = complaintRepository.findById(complaintId);

        if (complaint.isPresent()) {
            complaint.get().setStatus(Status.RESOLVED);
            complaint.get().setResolutionNotes(resolutionNotes);
            complaint.get().setResolvedAt(System.currentTimeMillis());
            complaintRepository.save(complaint.get());
        }
    }

    public void rejectComplaint(ObjectId complaintId, String resolutionNotes) {
        Optional<Complaint> complaint = complaintRepository.findById(complaintId);

        if (complaint.isPresent()) {
            complaint.get().setStatus(Status.REJECTED);
            complaint.get().setResolutionNotes(resolutionNotes);
            complaint.get().setResolvedAt(System.currentTimeMillis());
            complaintRepository.save(complaint.get());
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