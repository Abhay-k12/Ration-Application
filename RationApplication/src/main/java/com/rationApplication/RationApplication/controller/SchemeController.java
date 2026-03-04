package com.rationApplication.RationApplication.controller;

import com.rationApplication.RationApplication.service.SchemeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/complaint")
public class SchemeController {

    @Autowired
    private SchemeService schemeService;
}
