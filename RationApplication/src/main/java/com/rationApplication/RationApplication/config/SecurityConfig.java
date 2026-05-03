package com.rationApplication.RationApplication.config;

import com.rationApplication.RationApplication.security.JwtAuthenticationEntryPoint;
import com.rationApplication.RationApplication.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(
        securedEnabled = true,
        jsr250Enabled = true,
        prePostEnabled = true
)
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    @Override
    public AuthenticationManager authenticationManagerBean() throws Exception {
        return super.authenticationManagerBean();
    }

    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        auth
                .userDetailsService(userDetailsService)
                .passwordEncoder(passwordEncoder());
    }

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
                .cors()
                .and()
                .csrf()
                .disable()
                .httpBasic()
                .disable()
                .exceptionHandling()
                .authenticationEntryPoint(jwtAuthenticationEntryPoint)
                .and()
                .sessionManagement()
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                .and()
                .authorizeRequests()

                // PUBLIC ENDPOINTS - No authentication required
                .antMatchers("/").permitAll()
                .antMatchers("/index.html").permitAll()
                .antMatchers("/login_page.html").permitAll()
                .antMatchers("/error").permitAll()

                // DASHBOARD HTML FILES - No authentication required (client-side auth check)
                .antMatchers("/beneficiary_dashboard.html").permitAll()
                .antMatchers("/distributor_dashboard.html").permitAll()
                .antMatchers("/admin_dashboard.html").permitAll()

                // STATIC RESOURCES - No authentication required
                .antMatchers("/favicon.ico").permitAll()
                .antMatchers("/static/**").permitAll()
                .antMatchers("/css/**").permitAll()
                .antMatchers("/js/**").permitAll()
                .antMatchers("/images/**").permitAll()
                .antMatchers("/*.css").permitAll()
                .antMatchers("/*.js").permitAll()

                // AUTHENTICATION ENDPOINTS - No authentication required
                .antMatchers(HttpMethod.POST, "/auth/register").permitAll()
                .antMatchers(HttpMethod.POST, "/auth/login").permitAll()
                .antMatchers(HttpMethod.POST, "/auth/refresh").permitAll()
                .antMatchers(HttpMethod.GET, "/auth/validate").permitAll()
                .antMatchers(HttpMethod.POST, "/auth/forgot-password/**").permitAll()

                // COMPLAINT ENDPOINTS - No authentication required (public complaints)
                .antMatchers(HttpMethod.POST, "/complaint/register").permitAll()
                .antMatchers(HttpMethod.PUT, "/complaint/resolveComplaint/**").permitAll()
                .antMatchers(HttpMethod.PUT, "/complaint/rejectComplaint/**").permitAll()
                .antMatchers(HttpMethod.GET, "/complaint/**").permitAll()

                // BENEFICIARY ENDPOINTS - Require BENEFICIARY role
                .antMatchers(HttpMethod.POST, "/beneficiary/**").hasRole("BENEFICIARY")
                .antMatchers(HttpMethod.GET, "/beneficiary/getMembers").hasRole("BENEFICIARY")  // NEW
                .antMatchers(HttpMethod.GET, "/beneficiary/getTransactions").hasRole("BENEFICIARY")  // NEW
                .antMatchers(HttpMethod.GET, "/beneficiary/getComplaints").hasRole("BENEFICIARY")  // NEW
                .antMatchers(HttpMethod.PUT, "/beneficiary/**").hasRole("BENEFICIARY")
                .antMatchers(HttpMethod.DELETE, "/beneficiary/**").hasRole("BENEFICIARY")

                // DISTRIBUTOR ENDPOINTS - Require DISTRIBUTOR role
                .antMatchers(HttpMethod.POST, "/distributor/**").hasRole("DISTRIBUTOR")
                .antMatchers(HttpMethod.GET, "/distributor/**").hasRole("DISTRIBUTOR")
                .antMatchers(HttpMethod.PUT, "/distributor/**").hasRole("DISTRIBUTOR")
                .antMatchers(HttpMethod.DELETE, "/distributor/**").hasRole("DISTRIBUTOR")

                // ADMIN ENDPOINTS - Require ADMIN role
                .antMatchers(HttpMethod.POST, "/admin/**").hasRole("ADMIN")
                .antMatchers(HttpMethod.GET, "/admin/**").hasRole("ADMIN")
                .antMatchers(HttpMethod.PUT, "/admin/**").hasRole("ADMIN")
                .antMatchers(HttpMethod.DELETE, "/admin/**").hasRole("ADMIN")

                // SCHEME ENDPOINTS - Require ADMIN role
                .antMatchers(HttpMethod.POST, "/scheme/create").hasRole("ADMIN")
                .antMatchers(HttpMethod.GET, "/scheme/getByDistrict").hasAnyRole("ADMIN", "DISTRIBUTOR", "BENEFICIARY")
                .antMatchers(HttpMethod.GET, "/scheme/getById/**").hasAnyRole("ADMIN", "DISTRIBUTOR", "BENEFICIARY")
                .antMatchers(HttpMethod.GET, "/scheme/getAll").hasAnyRole("ADMIN", "DISTRIBUTOR", "BENEFICIARY")
                .antMatchers(HttpMethod.PUT, "/scheme/update/**").hasRole("ADMIN")
                .antMatchers(HttpMethod.DELETE, "/scheme/delete/**").hasRole("ADMIN")

                // ALL OTHER REQUESTS - Require authentication
                .anyRequest().authenticated()
                .and()
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
    }
}