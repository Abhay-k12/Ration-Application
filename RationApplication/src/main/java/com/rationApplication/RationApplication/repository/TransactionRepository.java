package com.rationApplication.RationApplication.repository;

import com.rationApplication.RationApplication.entity.Transaction;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.YearMonth;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends MongoRepository<Transaction, String> {

    List<Transaction> findByBeneficiaryUsername(String beneficiaryUsername);

    List<Transaction> findByTransactionMonth(YearMonth transactionMonth);

    @Query("{ 'beneficiaryUsername': ?0, 'transactionMonth': ?1, 'isUsed': true }")
    Transaction findByBeneficiaryUsernameAndTransactionMonthAndIsUsedTrue(
            String beneficiaryUsername, YearMonth transactionMonth);

    @Query("{ 'receiptNumber': ?0 }")
    Optional<Transaction> findByReceiptNumber(String receiptNumber);

    @Query("{ 'distributorUsername': ?0 }")
    List<Transaction> findByDistributorUsername(String distributorUsername);

    @Query("{ 'stateDistrictCode': ?0 }")
    List<Transaction> findByRegion(String stateDistrictCode);

    @Query("{ 'isOnlineTransaction': true }")
    List<Transaction> findOnlineTransactions();

    @Query("{ 'isOnlineTransaction': false }")
    List<Transaction> findOfflineTransactions();

    @Query("{ 'isSynced': false }")
    List<Transaction> findUnsyncedTransactions();

    @Query("{ 'status': ?0 }")
    List<Transaction> findByStatus(String status);

    @Query("{ 'beneficiaryUsername': ?0 }")
    long countByBeneficiaryUsername(String beneficiaryUsername);

    @Query("{ 'transactionMonth': ?0, 'stateDistrictCode': ?1 }")
    long countByTransactionMonthAndRegion(YearMonth transactionMonth, String stateDistrictCode);
}