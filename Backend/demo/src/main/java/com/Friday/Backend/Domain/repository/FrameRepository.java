package com.Friday.Backend.Domain.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.Friday.Backend.Domain.db.Frame;
import com.Friday.Backend.Domain.db.Video;

import java.util.Optional;

public interface FrameRepository extends JpaRepository<Frame, Long> {
    Optional<Frame> findByVideo(Video video);
}