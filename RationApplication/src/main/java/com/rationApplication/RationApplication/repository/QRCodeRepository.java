package com.rationApplication.RationApplication.repository;

import com.rationApplication.RationApplication.entity.QRCode;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface QRCodeRepository extends MongoRepository<QRCode, String> {
    QRCode findByQrData(String qrData);

    QRCode findByBeneficiaryUsernameAndIsActiveTrueAndIsUsedFalse(String beneficiaryUsername);
}