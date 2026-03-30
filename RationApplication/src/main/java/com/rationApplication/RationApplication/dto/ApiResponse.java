package com.rationApplication.RationApplication.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse {
    private boolean success;
    private String message;

    public ApiResponse(String message) {
        this.message = message;
        this.success = false;
    }
}