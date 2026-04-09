package com.rationApplication.RationApplication.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.rationApplication.RationApplication.entity.Aadhaar;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class QRCodeResponse {

    private String qrCodeData;
    private String qrCodeImage;
    private String rationCardNumber;
    private String beneficiaryName;
    private String username;
    private String generatedAt;
    private boolean success;
    private String message;
    private List<Aadhaar> familyMembers;


    public QRCodeResponse(String qrCodeData, String qrCodeImage, String rationCardNumber,
                          String beneficiaryName, String username, String generatedAt, List<Aadhaar> familyMembers) {
        this.qrCodeData = qrCodeData;
        this.qrCodeImage = qrCodeImage;
        this.rationCardNumber = rationCardNumber;
        this.beneficiaryName = beneficiaryName;
        this.username = username;
        this.generatedAt = generatedAt;
        this.familyMembers = familyMembers;
        this.success = true;
        this.message = "QR code generated successfully";
    }

    public QRCodeResponse(String qrCodeData, String qrCodeImage, String rationCardNumber,
                          String beneficiaryName, String username, String generatedAt) {
        this.qrCodeData = qrCodeData;
        this.qrCodeImage = qrCodeImage;
        this.rationCardNumber = rationCardNumber;
        this.beneficiaryName = beneficiaryName;
        this.username = username;
        this.generatedAt = generatedAt;
        this.success = true;
        this.message = "QR code generated successfully";
    }


    public QRCodeResponse(String message, boolean success) {
        this.message = message;
        this.success = success;
    }

    @Override
    public String toString() {
        return "QRCodeResponse{" +
                "rationCardNumber='" + rationCardNumber + '\'' +
                ", beneficiaryName='" + beneficiaryName + '\'' +
                ", success=" + success +
                ", generatedAt='" + generatedAt + '\'' +
                '}';
    }
}