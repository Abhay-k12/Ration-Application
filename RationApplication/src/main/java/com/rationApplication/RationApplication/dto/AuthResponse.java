package com.rationApplication.RationApplication.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuthResponse {

    private String token;
    private String refreshToken;
    private String username;
    private List<String> roles;
    private String email;
    private String stateDistrictCode;
    private String message;
    private boolean success;


    public AuthResponse(String token, String username, List<String> roles, String email, String stateDistrictCode) {
        this.token = token;
        this.username = username;
        this.roles = roles;
        this.email = email;
        this.stateDistrictCode = stateDistrictCode;
        this.message = "Success";
        this.success = true;
    }


    public AuthResponse(String token, String refreshToken, String username, List<String> roles, String email, String stateDistrictCode) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.username = username;
        this.roles = roles;
        this.email = email;
        this.stateDistrictCode = stateDistrictCode;
        this.message = "Success";
        this.success = true;
    }


    public AuthResponse(String message, boolean success) {
        this.message = message;
        this.success = success;
    }


    public AuthResponse(String message, boolean success, String username) {
        this.message = message;
        this.success = success;
        this.username = username;
    }

    @Override
    public String toString() {
        return "AuthResponse{" +
                "username='" + username + '\'' +
                ", roles=" + roles +
                ", stateDistrictCode='" + stateDistrictCode + '\'' +
                ", success=" + success +
                '}';
    }
}