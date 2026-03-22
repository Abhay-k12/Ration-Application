package com.rationApplication.RationApplication.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "QRCode")
public class QRCode {

    @Id
    private ObjectId id;

    @Indexed(unique = true)
    private String qrData;

    private String beneficiaryUsername;

    private String rationCardNumber;

    private LocalDateTime generatedAt;

    private LocalDateTime expiresAt;

    private boolean isActive;

    private boolean isUsed;

    private LocalDateTime usedAt;

    private String qrImageUrl;

    private int width;

    private int height;
}