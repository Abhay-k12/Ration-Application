package com.rationApplication.RationApplication;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
public class RationApplication {

	public static void main(String[] args) {
		SpringApplication.run(RationApplication.class, args);
	}

}






















/*
ADMIN:
username: admin001
password: Admin@123

DISTRIBUTOR:
username: distributor001
password: Distributor@123

BENEFICIARY
username: UP-1234,
password: Beneficiary@123,
*/