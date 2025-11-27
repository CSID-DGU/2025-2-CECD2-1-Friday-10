package com.Friday.Backend.Domain.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.Friday.Backend.Domain.db.User;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUserId(String userId);
}