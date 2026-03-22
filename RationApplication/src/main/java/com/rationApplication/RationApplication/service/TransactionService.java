package com.rationApplication.RationApplication.service;

import com.rationApplication.RationApplication.entity.Beneficiary;
import com.rationApplication.RationApplication.entity.Scheme;
import com.rationApplication.RationApplication.entity.Transaction;
import com.rationApplication.RationApplication.enums.Status;
import com.rationApplication.RationApplication.repository.BeneficiaryRepository;
import com.rationApplication.RationApplication.repository.SchemeRepository;
import com.rationApplication.RationApplication.repository.TransactionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
public class TransactionService {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private BeneficiaryRepository beneficiaryRepository;

    @Autowired
    private SchemeRepository schemeRepository;


    @Transactional
    public Transaction processTransaction(String beneficiaryUsername, String aadhaarNumber,
                                          String schemeId, boolean isOnline, String qrCodeUsed,
                                          String distributorUsername) throws Exception {
        try {
            YearMonth currentMonth = YearMonth.now();

            Transaction existingTransaction = transactionRepository
                    .findByBeneficiaryUsernameAndTransactionMonthAndIsUsedTrue(
                            beneficiaryUsername, currentMonth);

            if (existingTransaction != null) {
                throw new IllegalArgumentException("Beneficiary has already claimed ration for " +
                        currentMonth);
            }

            Beneficiary beneficiary = beneficiaryRepository.findByUsername(beneficiaryUsername);
            if (beneficiary == null) {
                throw new IllegalArgumentException("Beneficiary not found");
            }

            Transaction transaction = new Transaction();
            transaction.setBeneficiaryUsername(beneficiaryUsername);
            transaction.setBeneficiary(beneficiary);
            transaction.setDateOfTransaction(LocalDateTime.now());
            transaction.setTransactionMonth(currentMonth);
            transaction.setAadhaarNumber(aadhaarNumber);
            transaction.setSchemeId(schemeId);

            transaction.setIsOnlineTransaction(isOnline);
            transaction.setIsSynced(isOnline);
            transaction.setIsUsed(true);

            transaction.setQrCodeUsed(qrCodeUsed);
            transaction.setFaceVerified(true);
            transaction.setVerificationMethod("MANUAL_BYPASS");
            transaction.setReceiptNumber(generateReceiptNumber());
            transaction.setDistributorUsername(distributorUsername);
            transaction.setStateDistrictCode(beneficiary.getStateDistrictCode());
            transaction.setStatus(Status.COMPLETED);
            transaction.setCreatedAt(System.currentTimeMillis());

            transactionRepository.save(transaction);

            // Add to beneficiary's transactions
            if (beneficiary.getTransactions() == null) {
                beneficiary.setTransactions(new ArrayList<>());
            }
            beneficiary.getTransactions().add(transaction);
            beneficiaryRepository.save(beneficiary);

            log.info("Transaction processed for beneficiary: {} with receipt: {}",
                    beneficiaryUsername, transaction.getReceiptNumber());
            return transaction;
        } catch (IllegalArgumentException e) {
            log.warn("Validation error in transaction: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Error processing transaction: {}", e.getMessage(), e);
            throw e;
        }
    }


    public List<Transaction> getTransactionsByBeneficiary(String beneficiaryUsername) {
        try {
            return transactionRepository.findByBeneficiaryUsername(beneficiaryUsername);
        } catch (Exception e) {
            log.error("Error getting transactions for beneficiary: {}", e.getMessage());
            return new ArrayList<>();
        }
    }


    public List<Transaction> getTransactionsByMonth(YearMonth month) {
        try {
            return transactionRepository.findByTransactionMonth(month);
        } catch (Exception e) {
            log.error("Error getting transactions by month: {}", e.getMessage());
            return new ArrayList<>();
        }
    }


    public boolean hasClaimedThisMonth(String beneficiaryUsername) {
        try {
            YearMonth currentMonth = YearMonth.now();
            Transaction transaction = transactionRepository
                    .findByBeneficiaryUsernameAndTransactionMonthAndIsUsedTrue(
                            beneficiaryUsername, currentMonth);
            return transaction != null;
        } catch (Exception e) {
            log.error("Error checking monthly claim: {}", e.getMessage());
            return false;
        }
    }


    public List<Transaction> getTransactionsByDistributor(String distributorUsername) {
        try {
            return transactionRepository.findByDistributorUsername(distributorUsername);
        } catch (Exception e) {
            log.error("Error getting transactions by distributor: {}", e.getMessage());
            return new ArrayList<>();
        }
    }


    public List<Transaction> getTransactionsByRegion(String stateDistrictCode) {
        try {
            return transactionRepository.findByRegion(stateDistrictCode);
        } catch (Exception e) {
            log.error("Error getting transactions by region: {}", e.getMessage());
            return new ArrayList<>();
        }
    }


    public List<Transaction> getUnsyncedTransactions() {
        try {
            return transactionRepository.findUnsyncedTransactions();
        } catch (Exception e) {
            log.error("Error getting unsynced transactions: {}", e.getMessage());
            return new ArrayList<>();
        }
    }


    public void markAsSynced(String transactionId) {
        try {
            var transaction = transactionRepository.findById(transactionId);
            if (transaction.isPresent()) {
                transaction.get().setIsSynced(true);
                transaction.get().setUpdatedAt(System.currentTimeMillis());
                transactionRepository.save(transaction.get());
                log.info("Transaction marked as synced: {}", transactionId);
            }
        } catch (Exception e) {
            log.error("Error marking transaction as synced: {}", e.getMessage());
        }
    }


    private String generateReceiptNumber() {
        return "REC-" + System.currentTimeMillis() + "-" +
                UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }


    public Transaction getTransactionByReceiptNumber(String receiptNumber) {
        try {
            return transactionRepository.findByReceiptNumber(receiptNumber).orElse(null);
        } catch (Exception e) {
            log.error("Error getting transaction by receipt number: {}", e.getMessage());
            return null;
        }
    }


    public long getTransactionCount(String beneficiaryUsername) {
        try {
            return transactionRepository.countByBeneficiaryUsername(beneficiaryUsername);
        } catch (Exception e) {
            log.error("Error counting transactions: {}", e.getMessage());
            return 0;
        }
    }
}