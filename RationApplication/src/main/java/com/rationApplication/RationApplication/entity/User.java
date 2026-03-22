package com.rationApplication.RationApplication.entity;

import com.mongodb.lang.NonNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "User")
public class User {

    @Id
    private String id;

    @Indexed(unique = true)
    @NonNull
    private String username;

    @NonNull
    private String password;

    private String email;

    private List<String> roles;

    @Indexed
    private String stateDistrictCode;

    @DBRef
    private List<Complaint> complaints;

    private long createdAt;

    private long updatedAt;

    private Boolean isActive = true;

    private String userType;


    public User(Beneficiary beneficiary) {
        this.username = beneficiary.getUsername();
        this.password = beneficiary.getPassword();
        this.email = beneficiary.getEmail();
        this.stateDistrictCode = beneficiary.getStateDistrictCode();
        this.complaints = new ArrayList<>();
        this.roles = new ArrayList<>();
        this.userType = "BENEFICIARY";
        this.isActive = true;
        this.createdAt = System.currentTimeMillis();
        this.updatedAt = System.currentTimeMillis();
    }


    public void initializeComplaints() {
        if (this.complaints == null) {
            this.complaints = new ArrayList<>();
        }
    }


    public void addComplaint(Complaint complaint) {
        initializeComplaints();
        this.complaints.add(complaint);
    }


    public void removeComplaint(Complaint complaint) {
        if (this.complaints != null) {
            this.complaints.remove(complaint);
        }
    }


    public int getComplaintsCount() {
        return this.complaints != null ? this.complaints.size() : 0;
    }


    public void setIsActive(boolean isActive) {
        this.isActive = isActive;
        this.updatedAt = System.currentTimeMillis();
    }


    public boolean isUserActive() {
        return this.isActive != null && this.isActive;
    }


    public void updateTimestamp() {
        this.updatedAt = System.currentTimeMillis();
    }


    public boolean isValid() {
        return !this.username.isEmpty() && !this.password.isEmpty() && this.stateDistrictCode != null && !this.stateDistrictCode.isEmpty();
    }


    @Override
    public String toString() {
        return "User{" +
                "id='" + id + '\'' +
                ", username='" + username + '\'' +
                ", email='" + email + '\'' +
                ", roles=" + roles +
                ", stateDistrictCode='" + stateDistrictCode + '\'' +
                ", userType='" + userType + '\'' +
                ", isActive=" + isActive +
                ", complaintsCount=" + getComplaintsCount() +
                ", createdAt=" + createdAt +
                '}';
    }
}