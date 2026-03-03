package com.rationApplication.RationApplication.entity;

import com.rationApplication.RationApplication.enums.SchemeType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@AllArgsConstructor
@Data
@NoArgsConstructor
@Document(collection = "Scheme")
public class Scheme {

    @Id
    private ObjectId id;

    private SchemeType schemeType;

    private String schemeName;

    private String stateDistrictCode;

    List<String> suppliesName;

    List<Float> suppliesCost;
}
