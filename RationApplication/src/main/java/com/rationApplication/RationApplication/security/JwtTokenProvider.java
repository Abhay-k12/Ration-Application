package com.rationApplication.RationApplication.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.List;

@Component
@Slf4j
public class JwtTokenProvider {

    @Value("${app.jwtSecret:mySecretKeyForRationApplicationThatIsVeryLongAndSecureForJWTOperations}")
    private String jwtSecret;

    @Value("${app.jwtExpirationMs:86400000}")  // 24 hours in milliseconds
    private int jwtExpirationMs;

    @Value("${app.refreshTokenExpirationMs:604800000}")  // 7 days in milliseconds
    private int refreshTokenExpirationMs;


    public String generateToken(String username, List<String> roles) {
        try {
            Key key = Keys.hmacShaKeyFor(jwtSecret.getBytes());

            return Jwts.builder()
                    .setSubject(username)
                    .claim("roles", roles)
                    .setIssuedAt(new Date())
                    .setExpiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                    .signWith(key, SignatureAlgorithm.HS512)
                    .compact();
        } catch (Exception e) {
            log.error("Error generating JWT token: {}", e.getMessage());
            throw new RuntimeException("Failed to generate JWT token", e);
        }
    }


    public String generateRefreshToken(String username) {
        try {
            Key key = Keys.hmacShaKeyFor(jwtSecret.getBytes());

            return Jwts.builder()
                    .setSubject(username)
                    .setIssuedAt(new Date())
                    .setExpiration(new Date(System.currentTimeMillis() + refreshTokenExpirationMs))
                    .signWith(key, SignatureAlgorithm.HS512)
                    .compact();
        } catch (Exception e) {
            log.error("Error generating refresh token: {}", e.getMessage());
            throw new RuntimeException("Failed to generate refresh token", e);
        }
    }


    public String getUsernameFromToken(String token) {
        try {
            Key key = Keys.hmacShaKeyFor(jwtSecret.getBytes());

            return Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody()
                    .getSubject();
        } catch (ExpiredJwtException e) {
            log.warn("JWT token has expired");
            return e.getClaims().getSubject();
        } catch (Exception e) {
            log.error("Error extracting username from token: {}", e.getMessage());
            return null;
        }
    }


    @SuppressWarnings("unchecked")
    public List<String> getRolesFromToken(String token) {
        try {
            Key key = Keys.hmacShaKeyFor(jwtSecret.getBytes());

            return (List<String>) Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody()
                    .get("roles");
        } catch (Exception e) {
            log.error("Error extracting roles from token: {}", e.getMessage());
            return null;
        }
    }


    public boolean validateToken(String token) {
        try {
            if (token == null || token.isEmpty()) {
                log.warn("Token is null or empty");
                return false;
            }

            Key key = Keys.hmacShaKeyFor(jwtSecret.getBytes());

            Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token);

            log.debug("Token validated successfully");
            return true;
        } catch (ExpiredJwtException e) {
            log.warn("JWT token has expired: {}", e.getMessage());
            return false;
        } catch (UnsupportedJwtException e) {
            log.warn("Unsupported JWT token: {}", e.getMessage());
            return false;
        } catch (MalformedJwtException e) {
            log.warn("Invalid JWT token: {}", e.getMessage());
            return false;
        } catch (SignatureException e) {
            log.warn("JWT signature validation failed: {}", e.getMessage());
            return false;
        } catch (IllegalArgumentException e) {
            log.warn("JWT claims string is empty: {}", e.getMessage());
            return false;
        } catch (Exception e) {
            log.error("Error validating token: {}", e.getMessage());
            return false;
        }
    }


    public boolean isTokenExpired(String token) {
        try {
            Key key = Keys.hmacShaKeyFor(jwtSecret.getBytes());

            Date expiration = Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody()
                    .getExpiration();

            return expiration.before(new Date());
        } catch (ExpiredJwtException e) {
            return true;
        } catch (Exception e) {
            log.error("Error checking token expiration: {}", e.getMessage());
            return true;  // Assume expired on error
        }
    }


    public Date getTokenExpirationTime(String token) {
        try {
            Key key = Keys.hmacShaKeyFor(jwtSecret.getBytes());

            return Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody()
                    .getExpiration();
        } catch (Exception e) {
            log.error("Error getting token expiration time: {}", e.getMessage());
            return null;
        }
    }


    public Date getTokenIssuedTime(String token) {
        try {
            Key key = Keys.hmacShaKeyFor(jwtSecret.getBytes());

            return Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody()
                    .getIssuedAt();
        } catch (Exception e) {
            log.error("Error getting token issued time: {}", e.getMessage());
            return null;
        }
    }
}