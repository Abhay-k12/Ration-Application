package com.rationApplication.RationApplication.service;

import com.rationApplication.RationApplication.repository.SchemeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class SchemeService {

    @Autowired
    private SchemeRepository schemeRepository;

}
