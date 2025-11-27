package com.Friday.Backend.Service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.Friday.Backend.Domain.db.User;
import com.Friday.Backend.Domain.repository.UserRepository;
import com.Friday.Backend.Security.JwtTokenProvider;

import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final VideoService videoService;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(
        UserRepository userRepository,
        VideoService videoService,
        PasswordEncoder passwordEncoder,
        JwtTokenProvider jwtTokenProvider
    ) {
        this.userRepository = userRepository;
        this.videoService = videoService;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Transactional
    public void signup(String userId, String rawPassword, String email) {
        Optional<User> existingUser = userRepository.findByUserId(userId);
        if (existingUser.isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이미 존재하는 사용자 ID입니다.");
        }

        String encodedPassword = passwordEncoder.encode(rawPassword);

        User user = new User(userId, encodedPassword, email);
        userRepository.save(user);
    }

    public String login(String userId, String password) {
        User user = userRepository.findByUserId(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "사용자를 찾을 수 없습니다."));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "비밀번호가 일치하지 않습니다.");
        }

        return jwtTokenProvider.createToken(userId);
    }

    @Transactional
    public void deleteUser(String userId) {

        boolean isDeleted = videoService.deleteUser(userId); 

        if (!isDeleted) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "삭제할 사용자를 찾을 수 없습니다.");
        }
    }
}