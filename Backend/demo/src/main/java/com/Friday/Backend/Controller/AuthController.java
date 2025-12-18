package com.Friday.Backend.Controller;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.Friday.Backend.Dto.LoginDto;
import com.Friday.Backend.Dto.SigninDto;
import com.Friday.Backend.Dto.SignuptDto;
import com.Friday.Backend.Service.AuthService;

import org.springframework.http.ResponseEntity;

import jakarta.validation.Valid;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signup")
    public Map<String, String> signup(@Valid @RequestBody SignuptDto requestDto) {

        authService.signup(requestDto.getUserId(), requestDto.getPassword(), requestDto.getEmail());

        return Map.of("message", "가입이 완료되었습니다.");
    }

    @PostMapping("/login")
    public ResponseEntity<LoginDto> login(@Valid @RequestBody SigninDto requestDto) {
        String token = authService.login(requestDto.getUserId(), requestDto.getPassword());
        
        LoginDto response = new LoginDto(token);
        
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/users")
    public ResponseEntity<Void> deleteUser() {
        String authenticatedUserId = SecurityContextHolder.getContext().getAuthentication().getName();

        authService.deleteUser(authenticatedUserId);
        
        return ResponseEntity.noContent().build();
    }
}