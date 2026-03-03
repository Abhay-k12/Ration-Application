package com.rationApplication.RationApplication.entity;

import com.rationApplication.RationApplication.enums.Status;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "Complaint")
public class Complaint {

    @Id
    private ObjectId id;

    private User applicant;

    private String title;

    private String body;

    private String documentLink;

    private String response;

    private Status status;

    private LocalDateTime registrationDate;

    private LocalDateTime resolvedDate;
}
