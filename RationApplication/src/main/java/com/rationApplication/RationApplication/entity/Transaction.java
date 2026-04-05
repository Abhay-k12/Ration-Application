package com.rationApplication.RationApplication.entity;

import com.rationApplication.RationApplication.enums.Status;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.time.YearMonth;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "Transaction")
public class Transaction {

    @Id
    private String id;

    @Indexed
    private String beneficiaryUsername;

    @DBRef
    private Beneficiary beneficiary;

    private String aadhaarNumber;

    private String receiptNumber;

    @Indexed
    private YearMonth transactionMonth;

    private LocalDateTime dateOfTransaction;

    private boolean isOnlineTransaction;
    private boolean isSynced;
    private boolean isUsed;

    private String qrCodeUsed;
    private boolean faceVerified;
    private String verificationMethod;    // FACIAL_RECOGNITION, QR_SCAN, MANUAL_BYPASS

    private String schemeId;
    private double wheatQuantity;
    private double riceQuantity;
    private double sugarQuantity;
    private double keroseineQuantity;
    private double totalAmount;

    // Distributor Info
    @Indexed
    private String distributorUsername;

    private String distributorShopId;


    @Indexed
    private String stateDistrictCode;

    private Long createdAt;
    private Long updatedAt;

    private String notes;
    private Status status;


    public Transaction(String beneficiaryUsername, Beneficiary beneficiary,
                       LocalDateTime dateOfTransaction, YearMonth transactionMonth) {
        this.beneficiaryUsername = beneficiaryUsername;
        this.beneficiary = beneficiary;
        this.dateOfTransaction = dateOfTransaction;
        this.transactionMonth = transactionMonth;
        this.createdAt = System.currentTimeMillis();
        this.isUsed = true;
        this.status = Status.COMPLETED;
    }

    @Override
    public String toString() {
        return "Transaction{" +
                "id='" + id + '\'' +
                ", beneficiaryUsername='" + beneficiaryUsername + '\'' +
                ", receiptNumber='" + receiptNumber + '\'' +
                ", transactionMonth=" + transactionMonth +
                ", dateOfTransaction=" + dateOfTransaction +
                ", isOnlineTransaction=" + isOnlineTransaction +
                ", isSynced=" + isSynced +
                ", faceVerified=" + faceVerified +
                ", status='" + status + '\'' +
                '}';
    }

    public void setIsSynced(boolean b) {
        this.isSynced = true;
    }

    public void setIsUsed(boolean b) {
        this.isUsed = true;
    }

    public void setIsOnlineTransaction(boolean isOnline) {
        this.isOnlineTransaction = true;
    }
}