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
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "Transaction")
public class Transaction {

    @Id
    private String id;

    @Indexed
    private String beneficiaryUsername;

    private String aadhaarNumber;

    private YearMonth transactionMonth;

    private LocalDateTime dateOfTransaction;

    private boolean isSynced;

    private boolean faceVerified;

    List<String> suppliesName;

    List<Float> suppliesWeight;

    List<Float> costPerSupplies;

    @Indexed
    private String distributorUsername;

    private Long createdAt;

    private Status status;

    public Transaction(String beneficiaryUsername, LocalDateTime dateOfTransaction, YearMonth transactionMonth) {
        this.beneficiaryUsername = beneficiaryUsername;
        this.dateOfTransaction = dateOfTransaction;
        this.transactionMonth = transactionMonth;
        this.createdAt = System.currentTimeMillis();
        this.status = Status.COMPLETED;
    }

    @Override
    public String toString() {
        return "Transaction{" +
                "id='" + id + '\'' +
                ", beneficiaryUsername='" + beneficiaryUsername + '\'' +
                ", transactionMonth=" + transactionMonth +
                ", dateOfTransaction=" + dateOfTransaction +
                ", isSynced=" + isSynced +
                ", faceVerified=" + faceVerified +
                ", status='" + status + '\'' +
                '}';
    }

    public void setIsSynced(boolean b) {
        this.isSynced = true;
    }

}