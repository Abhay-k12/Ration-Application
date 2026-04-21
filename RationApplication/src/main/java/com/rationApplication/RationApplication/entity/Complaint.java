package com.rationApplication.RationApplication.entity;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import com.rationApplication.RationApplication.enums.Status;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "Complaint")
public class Complaint {

    @Id
    @JsonSerialize(using = ToStringSerializer.class)
    private ObjectId id;

    @Indexed
    private String applicantUsername;

    private String complaintTitle;

    private String description;

    private String category;

    private String documentLink;

    private Status status = Status.PROCESSING;

    private String resolutionNotes;

    @Indexed
    private String stateDistrictCode;

    private Long createdAt;
    private Long resolvedAt;


    public Complaint(String applicantUsername, String title, String description,
                     String category, String documentLink, String stateDistrictCode) {
        this.applicantUsername = applicantUsername;
        this.complaintTitle = title;
        this.description = description;
        this.category = category;
        this.documentLink = documentLink;
        this.stateDistrictCode = stateDistrictCode;
        this.createdAt = System.currentTimeMillis();
    }

    @Override
    public String toString() {
        return "Complaint{" +
                "id=" + id +
                ", applicantUsername='" + applicantUsername + '\'' +
                ", complaintTitle='" + complaintTitle + '\'' +
                ", status=" + status +
                ", stateDistrictCode='" + stateDistrictCode + '\'' +
                ", createdAt=" + createdAt +
                '}';
    }
}