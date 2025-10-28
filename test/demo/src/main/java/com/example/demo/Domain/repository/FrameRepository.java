package com.example.demo.Domain.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.Domain.db.Frame;
import com.example.demo.Domain.db.Video;

import java.util.Optional;

public interface FrameRepository extends JpaRepository<Frame, Long> {
    Optional<Frame> findByVideo(Video video);
}