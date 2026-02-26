package com.rationApplication.RationApplication.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection="User")
public class User {

    @Indexed(unique=true)
    @ID
    private String rationCardNumber;

    private String password;

    private List<String> Roles = new ArrayList<>();

    @DBref
    private List<AdharCard> familyMembers = new ArrayList<>();
}
