package com.rationApplication.RationApplication.service;

import com.rationApplication.RationApplication.entity.Beneficiary;
import com.rationApplication.RationApplication.entity.Scheme;
import com.rationApplication.RationApplication.entity.Transaction;
import com.rationApplication.RationApplication.enums.SchemeType;
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
                                          boolean useOthersScheme, String stateDistrictCode,
                                          String distributorUsername) throws Exception {
        try {
            log.info("[TRANSACTION] Starting for: {}, useOthersScheme: {}", beneficiaryUsername, useOthersScheme);

            YearMonth currentMonth = YearMonth.now();

            Beneficiary beneficiary = beneficiaryRepository.findByUsername(beneficiaryUsername);
            if (beneficiary == null) {
                throw new IllegalArgumentException("Beneficiary not found");
            }

            if (beneficiary.getTransactions() != null) {
                for (Transaction tx : beneficiary.getTransactions()) {
                    if (tx.getDateOfTransaction() != null) {
                        YearMonth txMonth = YearMonth.from(tx.getDateOfTransaction());
                        if (txMonth.equals(currentMonth)) {
                            throw new IllegalArgumentException("Beneficiary already claimed ration for " + currentMonth);
                        }
                    }
                }
            }

            log.info("[TRANSACTION] Beneficiary found with income: {}", beneficiary.getAnnualIncome());

            SchemeType applicableScheme;
            if (useOthersScheme) {
                applicableScheme = SchemeType.OTHERS;
                log.info("[SCHEME] Using OTHERS scheme (distributor choice)");
            } else {
                applicableScheme = determineSchemeByIncome(beneficiary.getAnnualIncome());
                log.info("[SCHEME] Using income-based scheme: {}", applicableScheme);
            }

            Scheme scheme = getSchemeByTypeAndDistrict(applicableScheme, stateDistrictCode);
            if (scheme == null) {
                throw new IllegalArgumentException("No scheme configuration found");
            }

            log.info("[SCHEME] Scheme: {}", scheme.getSchemeName());

            AllocationResult allocation = calculateAllocation(beneficiary, scheme, useOthersScheme, stateDistrictCode);

            Transaction transaction = new Transaction();
            transaction.setBeneficiaryUsername(beneficiaryUsername);
            transaction.setDateOfTransaction(LocalDateTime.now());  // Just use current date/time
            transaction.setAadhaarNumber(aadhaarNumber);
            transaction.setFaceVerified(true);
            transaction.setDistributorUsername(distributorUsername);
            transaction.setStatus(Status.COMPLETED);
            transaction.setCreatedAt(System.currentTimeMillis());

            transaction.setSuppliesName(allocation.suppliesName);
            transaction.setSuppliesWeight(allocation.suppliesWeight);
            transaction.setCostPerSupplies(allocation.costPerSupplies);

            transactionRepository.save(transaction);
            log.info("[TRANSACTION] Saved with ID: {}", transaction.getId());

            if (beneficiary.getTransactions() == null) {
                beneficiary.setTransactions(new ArrayList<>());
            }
            beneficiary.getTransactions().add(transaction);
            beneficiaryRepository.save(beneficiary);

            return transaction;

        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("[TRANSACTION] Error: {}", e.getMessage());
            throw new RuntimeException("Transaction failed: " + e.getMessage());
        }
    }

    // DETERMINE SCHEME BY INCOME
    private SchemeType determineSchemeByIncome(Integer annualIncome) {
        if (annualIncome == null || annualIncome == 0) {
            return SchemeType.ANNUAL_INCOME_LESS_THAN_3_LAKH;
        }

        if (annualIncome < 300000) {
            return SchemeType.ANNUAL_INCOME_LESS_THAN_3_LAKH;
        } else if (annualIncome >= 300000 && annualIncome < 600000) {
            return SchemeType.ANNUAL_INCOME_IN_BETWEEN_3_AND_6;
        } else {
            return SchemeType.ANNUAL_INCOME_MORE_THAN_6;
        }
    }

    // GET SCHEME BY TYPE AND DISTRICT
    private Scheme getSchemeByTypeAndDistrict(SchemeType schemeType, String stateDistrictCode) {
        try {
            log.info("[SCHEME] Fetching scheme - Type: {}, District: {}", schemeType, stateDistrictCode);

            List<Scheme> allSchemes = schemeRepository.findAll();

            for (Scheme scheme : allSchemes) {
                if (scheme.getSchemeType() == schemeType &&
                        scheme.getStateDistrictCode().equals(stateDistrictCode)) {
                    log.info("[SCHEME] Found matching scheme: {}", scheme.getSchemeName());
                    return scheme;
                }
            }

            log.warn("[SCHEME] No scheme found matching type: {} and district: {}", schemeType, stateDistrictCode);
            return null;
        } catch (Exception e) {
            log.error("[SCHEME] Error fetching scheme: {}", e.getMessage());
            return null;
        }
    }

    // CALCULATE ALLOCATION - MAIN LOGIC
    private AllocationResult calculateAllocation(Beneficiary beneficiary, Scheme scheme,
                                                 boolean useOthersScheme, String stateDistrictCode) throws Exception {

        log.info("[ALLOCATION] Starting allocation calculation, useOthersScheme: {}", useOthersScheme);

        AllocationResult result = new AllocationResult();
        result.suppliesName = new ArrayList<>();
        result.suppliesWeight = new ArrayList<>();
        result.costPerSupplies = new ArrayList<>();
        result.totalCost = 0;

        // STEP 1: SEPARATE CHILDREN (<5) FROM ADULTS
        int adultCount = 0;
        int childCount = 0;

        if (beneficiary.getMembers() != null) {
            for (com.rationApplication.RationApplication.entity.Aadhaar member : beneficiary.getMembers()) {
                int age = calculateAge(member.getDateOfBirth());
                if (age < 5) {
                    childCount++;
                    log.info("[CHILD] Age {}: {}", age, member.getName());
                } else {
                    adultCount++;
                    log.info("[ADULT] Age {}: {}", age, member.getName());
                }
            }
        }

        log.info("[ALLOCATION] Adults: {}, Children (<5): {}", adultCount, childCount);

        // STEP 2: ALLOCATE FOR CHILDREN USING CHILD SCHEME
        Scheme childScheme = null;
        if (childCount > 0) {
            childScheme = getSchemeByTypeAndDistrict(SchemeType.CHILD_SCHEME, stateDistrictCode);
        }

        if (childCount > 0 && childScheme != null) {
            log.info("[CHILD] Allocating using CHILD_SCHEME");
            for (int i = 0; i < childScheme.getSuppliesName().size(); i++) {
                String supplyName = childScheme.getSuppliesName().get(i);
                float perPersonQty = childScheme.getSupplyPerPerson().get(i);
                float cost = childScheme.getSuppliesCost().get(i);

                float totalQty = perPersonQty * childCount;
                float totalCost = totalQty * cost;

                result.suppliesName.add(supplyName);
                result.suppliesWeight.add(totalQty);
                result.costPerSupplies.add(totalCost);
                result.totalCost += totalCost;

                log.info("[CHILD] {}: {} × {} = {} kg, Rs {}", supplyName, perPersonQty, childCount, totalQty, totalCost);
            }
        }

        // STEP 3: ALLOCATE FOR ADULTS
        if (adultCount > 0) {
            log.info("[ADULT] Allocating for {} adults using scheme: {}", adultCount, scheme.getSchemeName());

            for (int i = 0; i < scheme.getSuppliesName().size(); i++) {
                String supplyName = scheme.getSuppliesName().get(i);
                float perPersonQty = scheme.getSupplyPerPerson().get(i);
                float cost = scheme.getSuppliesCost().get(i);

                float totalQty = perPersonQty * adultCount;
                float totalCost = totalQty * cost;

                int existingIdx = result.suppliesName.indexOf(supplyName);
                if (existingIdx >= 0) {
                    result.suppliesWeight.set(existingIdx, result.suppliesWeight.get(existingIdx) + totalQty);
                    result.costPerSupplies.set(existingIdx, result.costPerSupplies.get(existingIdx) + totalCost);
                    log.info("[ADULT] {} (ADD): {} × {} = {} kg, Rs {}", supplyName, perPersonQty, adultCount, totalQty, totalCost);
                } else {
                    result.suppliesName.add(supplyName);
                    result.suppliesWeight.add(totalQty);
                    result.costPerSupplies.add(totalCost);
                    log.info("[ADULT] {} (NEW): {} × {} = {} kg, Rs {}", supplyName, perPersonQty, adultCount, totalQty, totalCost);
                }
                result.totalCost += totalCost;
            }
        }

        // STEP 4: IF CHECKBOX CHECKED, ADD OTHERS SCHEME SUPPLIES TOO
        if (useOthersScheme) {
            log.info("[OTHERS] Adding OTHERS scheme supplies to existing allocation");

            Scheme othersScheme = getSchemeByTypeAndDistrict(SchemeType.OTHERS, stateDistrictCode);

            if (othersScheme != null) {
                // Add Others scheme supplies to EVERYONE (children + adults)
                int totalMembers = adultCount + childCount;

                for (int i = 0; i < othersScheme.getSuppliesName().size(); i++) {
                    String supplyName = othersScheme.getSuppliesName().get(i);
                    float perPersonQty = othersScheme.getSupplyPerPerson().get(i);
                    float cost = othersScheme.getSuppliesCost().get(i);

                    float totalQty = perPersonQty * totalMembers;
                    float totalCost = totalQty * cost;

                    int existingIdx = result.suppliesName.indexOf(supplyName);
                    if (existingIdx >= 0) {
                        // Supply already exists, add to it
                        result.suppliesWeight.set(existingIdx, result.suppliesWeight.get(existingIdx) + totalQty);
                        result.costPerSupplies.set(existingIdx, result.costPerSupplies.get(existingIdx) + totalCost);
                        log.info("[OTHERS] {} (ADD): {} × {} = {} kg, Rs {}", supplyName, perPersonQty, totalMembers, totalQty, totalCost);
                    } else {
                        // New supply from Others scheme
                        result.suppliesName.add(supplyName);
                        result.suppliesWeight.add(totalQty);
                        result.costPerSupplies.add(totalCost);
                        log.info("[OTHERS] {} (NEW): {} × {} = {} kg, Rs {}", supplyName, perPersonQty, totalMembers, totalQty, totalCost);
                    }
                    result.totalCost += totalCost;
                }
            } else {
                log.warn("[OTHERS] OTHERS scheme not found for district");
            }
        }

        log.info("[ALLOCATION] Final: {} supplies, Total: Rs {}", result.suppliesName.size(), result.totalCost);
        return result;
    }

    // CALCULATE AGE FROM DOB
    private int calculateAge(java.time.LocalDate dateOfBirth) {
        if (dateOfBirth == null) return 0;
        return (int) java.time.temporal.ChronoUnit.YEARS.between(dateOfBirth, java.time.LocalDate.now());
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
                transactionRepository.save(transaction.get());
                log.info("Transaction marked as synced: {}", transactionId);
            }
        } catch (Exception e) {
            log.error("Error marking transaction as synced: {}", e.getMessage());
        }
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

    // RESULT CLASS
    private static class AllocationResult {
        List<String> suppliesName;
        List<Float> suppliesWeight;
        List<Float> costPerSupplies;
        double totalCost;
    }
}