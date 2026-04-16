package com.rationApplication.RationApplication.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import javax.mail.internet.MimeMessage;

@Slf4j
@Service
public class EmailService {

    @Autowired
    private JavaMailSender javaMailSender;

    public void sendEmail(String to, String subject, String body) {
        try {
            if ("placeholder".equals(javaMailSender.toString())) {
                log.warn("SMTP uses placeholder credentials. Email sending skipped for: {}", to);
                return;
            }

            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            helper.setSubject(subject);
            
            // Build professional HTML layout
            String htmlContent = buildProfessionalHtml(subject, body);
            helper.setText(htmlContent, true);

            javaMailSender.send(message);
            log.info("Email sent successfully to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
            // We catch and log this instead of throwing so it doesn't crash runtime processes when SMTP is invalid
        }
    }

    private String buildProfessionalHtml(String subject, String content) {
        return "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head>\n" +
                "    <style>\n" +
                "        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f6f8; color: #333; }\n" +
                "        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }\n" +
                "        .header { background: #1a56db; padding: 20px; text-align: center; color: white; display: flex; align-items: center; justify-content: center; gap: 15px; }\n" +
                "        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }\n" +
                "        .content { padding: 30px; font-size: 16px; line-height: 1.6; }\n" +
                "        .content p { margin: 0 0 15px; }\n" +
                "        .alert-box { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0; border-radius: 4px; }\n" +
                "        .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <div class=\"container\">\n" +
                "        <div class=\"header\">\n" +
                "            <h1>Smart-Ration Notification</h1>\n" +
                "        </div>\n" +
                "        <div class=\"content\">\n" +
                "            <h2 style=\"color: #1e293b; margin-top: 0;\">" + subject + "</h2>\n" +
                "            " + content + "\n" +
                "            <p style=\"margin-top: 30px;\">Best regards,<br><strong>Smart-Ration Administration</strong></p>\n" +
                "        </div>\n" +
                "        <div class=\"footer\">\n" +
                "            <p>&copy; 2026 Smart-Ration Gov. Tracker. All rights reserved.</p>\n" +
                "            <p>This is an automated message. Please do not reply directly to this email.</p>\n" +
                "        </div>\n" +
                "    </div>\n" +
                "</body>\n" +
                "</html>";
    }
}
