package com.rationApplication.RationApplication.entity;

import com.mongodb.lang.NonNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection="User")
public class User {

    @Indexed(unique=true)
    @Id
    @NonNull
    private String username;

    @NonNull
    private String password;

    private String email;

    private List<String> Roles;

    private List<Complaint> complaints;
}
