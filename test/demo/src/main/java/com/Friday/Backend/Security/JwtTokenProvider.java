package com.Friday.Backend.Security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtParser;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import jakarta.annotation.PostConstruct;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.time.Instant;

@Component
public class JwtTokenProvider {

    @Value("${jwt.key}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expiration;

    private SecretKey secretKey;

    @PostConstruct
    public void init() {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String createToken(String userId) {
        Instant now = Instant.now();
        Instant expiry = now.plusMillis(expiration);

        return Jwts.builder()
        .claim(Claims.SUBJECT, userId)
        .claim(Claims.ISSUED_AT, Date.from(now))
        .claim(Claims.EXPIRATION, Date.from(expiry)) 
        .issuedAt(Date.from(now))
        .signWith(secretKey)
        .compact();
    }

    public String getUserId(String token) {
        JwtParser parser = Jwts.parser()
        .verifyWith(secretKey)
        .build();
                
        Claims claims = parser.parseSignedClaims(token).getPayload();
        
        return claims.getSubject();
    }

    public boolean validateToken(String token) {
        try {
            JwtParser parser = Jwts.parser()
            .verifyWith(secretKey)
            .build();
                    
            parser.parseSignedClaims(token);
            
            return true;
        } catch (Exception e) {
            System.out.println("Invalid JWT: " + e.getMessage());
            return false;
        }
    }
}