package com.rationApplication.RationApplication.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.rationApplication.RationApplication.dto.QRCodeResponse;
import com.rationApplication.RationApplication.entity.Beneficiary;
import com.rationApplication.RationApplication.entity.User;
import com.rationApplication.RationApplication.repository.BeneficiaryRepository;
import com.rationApplication.RationApplication.repository.UserRepository;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.util.*;

@Service
@Slf4j
public class QRCodeService {

    @Autowired
    private BeneficiaryRepository beneficiaryRepository;

    @Autowired
    private UserRepository userRepository;

    private static final int QR_CODE_WIDTH = 400;
    private static final int QR_CODE_HEIGHT = 400;

    // Store used QR codes with timestamp for tracking
    private static final Map<String, Long> usedQRCodes = new HashMap<>();


    public QRCodeResponse scanQRCode(String qrData) {
        try {
            if (qrData == null || qrData.isEmpty()) {
                log.warn("QR data is empty");
                return new QRCodeResponse("Invalid QR code data", false);
            }

            // Parse QR code
            QRCodeData qrCodeData = parseQRCodeData(qrData);

            // Check if QR code has been used already
            if (isQRCodeUsed(qrData)) {
                log.warn("QR code already used: {}", qrCodeData.getRationCardNumber());
                return new QRCodeResponse("QR code has already been used", false);
            }

            // Validate QR code is not expired
            if (!isQRCodeValid(qrData)) {
                log.warn("QR code expired: {}", qrCodeData.getRationCardNumber());
                return new QRCodeResponse("QR code has expired", false);
            }

            // Get beneficiary by username (which is rationCardNumber)
            Beneficiary beneficiary = beneficiaryRepository.findByUsername(qrCodeData.getUsername());
            if (beneficiary == null) {
                log.warn("Beneficiary not found for RC: {}", qrCodeData.getUsername());
                return new QRCodeResponse("Beneficiary not found", false);
            }

            // Check if beneficiary is verified
            if (!beneficiary.getIsActive()) {
                log.warn("Beneficiary not verified: {}", beneficiary.getUsername());
                return new QRCodeResponse("Beneficiary not yet verified", false);
            }

            // Create success response
            QRCodeResponse response = new QRCodeResponse(
                    qrData,
                    null,  // No need to return image on scan
                    beneficiary.getUsername(),  // This IS the rationCardNumber
                    beneficiary.getMembers() != null && !beneficiary.getMembers().isEmpty()
                            ? beneficiary.getMembers().get(0).getName()
                            : beneficiary.getUsername(),
                    beneficiary.getUsername(),  // This IS the rationCardNumber
                    Calendar.getInstance().getTime().toString(),
                    beneficiary.getMembers()
            );

            log.info("QR code scanned successfully: RC={}", beneficiary.getUsername());
            return response;

        } catch (Exception e) {
            log.error("Error scanning QR code: {}", e.getMessage(), e);
            return new QRCodeResponse("Error scanning QR code: " + e.getMessage(), false);
        }
    }


    public QRCodeResponse generateQRCode(String username, String rationCardNumber) {
        try {
            // Get user and beneficiary data
            User user = userRepository.findByUsername(username);
            if (user == null) {
                log.warn("User not found: {}", username);
                return new QRCodeResponse("User not found", false);
            }

            // In beneficiary, username IS the rationCardNumber
            Beneficiary beneficiary = beneficiaryRepository.findByUsername(username);
            if (beneficiary == null) {
                log.warn("Beneficiary not found: {}", username);
                return new QRCodeResponse("Beneficiary not found", false);
            }

            // Create QR code content with beneficiary details
            String qrContent = createQRContent(beneficiary);

            // Generate QR code image
            String qrCodeImage = generateQRCodeImage(qrContent);

            // Create response - username is the rationCardNumber
            QRCodeResponse response = new QRCodeResponse(
                    qrContent,
                    qrCodeImage,
                    beneficiary.getUsername(),  // This IS the rationCardNumber
                    beneficiary.getMembers() != null && !beneficiary.getMembers().isEmpty()
                            ? beneficiary.getMembers().get(0).getName()
                            : username,
                    beneficiary.getUsername(),  // This IS the rationCardNumber
                    Calendar.getInstance().getTime().toString(),
                    beneficiary.getMembers()
            );

            log.info("QR code generated successfully for beneficiary: {}", username);
            return response;

        } catch (Exception e) {
            log.error("Error generating QR code: {}", e.getMessage(), e);
            return new QRCodeResponse("Error generating QR code: " + e.getMessage(), false);
        }
    }


    private String createQRContent(Beneficiary beneficiary) {
        // Format: RC|USERNAME|NAME|REGION|TIMESTAMP
        // Note: username IS the rationCardNumber for beneficiary
        StringBuilder content = new StringBuilder();
        content.append("RC:").append(beneficiary.getUsername()).append("|");
        content.append("USER:").append(beneficiary.getUsername()).append("|");

        if (beneficiary.getMembers() != null && !beneficiary.getMembers().isEmpty()) {
            content.append("NAME:").append(beneficiary.getMembers().get(0).getName()).append("|");
        }

        content.append("REGION:").append(beneficiary.getStateDistrictCode()).append("|");
        content.append("TIME:").append(System.currentTimeMillis());

        return content.toString();
    }


    private String generateQRCodeImage(String qrContent) {
        try {
            MultiFormatWriter writer = new MultiFormatWriter();
            BitMatrix bitMatrix = writer.encode(qrContent, BarcodeFormat.QR_CODE,
                    QR_CODE_WIDTH, QR_CODE_HEIGHT);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", baos);
            byte[] imageData = baos.toByteArray();

            // Convert to Base64
            String base64Image = Base64.getEncoder().encodeToString(imageData);
            return "data:image/png;base64," + base64Image;

        } catch (Exception e) {
            log.error("Error converting QR code to image: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate QR code image", e);
        }
    }


    public QRCodeData parseQRCodeData(String qrCodeContent) {
        try {
            QRCodeData data = new QRCodeData();

            String[] parts = qrCodeContent.split("\\|");
            for (String part : parts) {
                if (part.startsWith("RC:")) {
                    data.setRationCardNumber(part.substring(3));
                } else if (part.startsWith("USER:")) {
                    data.setUsername(part.substring(5));
                } else if (part.startsWith("NAME:")) {
                    data.setName(part.substring(5));
                } else if (part.startsWith("REGION:")) {
                    data.setRegion(part.substring(7));
                } else if (part.startsWith("TIME:")) {
                    data.setTimestamp(Long.parseLong(part.substring(5)));
                }
            }

            log.info("QR code parsed successfully: RC={}", data.getRationCardNumber());
            return data;

        } catch (Exception e) {
            log.error("Error parsing QR code data: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to parse QR code data", e);
        }
    }


    public boolean isQRCodeValid(String qrCodeContent) {
        try {
            QRCodeData data = parseQRCodeData(qrCodeContent);
            long currentTime = System.currentTimeMillis();
            long timeDifference = currentTime - data.getTimestamp();

            // QR code valid for 24 hours
            long twentyFourHoursInMs = 24 * 60 * 60 * 1000;

            boolean isValid = timeDifference < twentyFourHoursInMs;
            log.info("QR code validation result: {}", isValid);
            return isValid;

        } catch (Exception e) {
            log.error("Error validating QR code: {}", e.getMessage());
            return false;
        }
    }


    public void clearExpiredUsedQRCodes() {
        try {
            long currentTime = System.currentTimeMillis();
            long thirtyDaysInMs = 30L * 24 * 60 * 60 * 1000;

            usedQRCodes.entrySet().removeIf(entry ->
                    (currentTime - entry.getValue()) > thirtyDaysInMs
            );

            log.info("Expired QR codes cleared. Remaining: {}", usedQRCodes.size());
        } catch (Exception e) {
            log.error("Error clearing expired QR codes: {}", e.getMessage());
        }
    }

    public void markQRAsUsed(String qrData) {
        try {
            if (qrData == null || qrData.isEmpty()) {
                log.warn("Cannot mark null QR code as used");
                return;
            }

            long currentTime = System.currentTimeMillis();
            usedQRCodes.put(qrData, currentTime);

            log.info("QR code marked as used: {}", qrData.substring(0, Math.min(20, qrData.length())));
        } catch (Exception e) {
            log.error("Error marking QR code as used: {}", e.getMessage());
        }
    }

    public boolean isQRCodeUsed(String qrData) {
        try {
            boolean isUsed = usedQRCodes.containsKey(qrData);
            if (isUsed) {
                long usedTime = usedQRCodes.get(qrData);
                long currentTime = System.currentTimeMillis();

                // QR code is considered "used" for 30 days
                long thirtyDaysInMs = 30L * 24 * 60 * 60 * 1000;

                if (currentTime - usedTime > thirtyDaysInMs) {
                    usedQRCodes.remove(qrData);
                    return false;
                }
            }
            return isUsed;
        } catch (Exception e) {
            log.error("Error checking if QR code is used: {}", e.getMessage());
            return false;
        }
    }

    @Setter
    @Getter
    public static class QRCodeData {
        private String rationCardNumber;
        private String username;
        private String name;
        private String region;
        private Long timestamp;

        public QRCodeData() {}

        public QRCodeData(String rationCardNumber, String username, String name, String region, Long timestamp) {
            this.rationCardNumber = rationCardNumber;
            this.username = username;
            this.name = name;
            this.region = region;
            this.timestamp = timestamp;
        }

        @Override
        public String toString() {
            return "QRCodeData{" +
                    "rationCardNumber='" + rationCardNumber + '\'' +
                    ", username='" + username + '\'' +
                    ", name='" + name + '\'' +
                    ", region='" + region + '\'' +
                    ", timestamp=" + timestamp +
                    '}';
        }
    }
}