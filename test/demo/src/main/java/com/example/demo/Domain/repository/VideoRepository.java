package com.example.demo.Domain.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.demo.Domain.db.User;
import com.example.demo.Domain.db.Video;

import java.util.List;
import java.util.Optional;

public interface VideoRepository extends JpaRepository<Video, String> {
    Optional<Video> findByVideoId(String videoId);

    List<Video> findByUser(User user);

    long countByUser(User user);

    List<Video> findAllByUser_UserId(String userId);

    @Query("SELECT v.objectName FROM Video v WHERE v.user.userId = :userId AND v.videoId = :videoId")
    Optional<String> findObjectNameByUserIdAndVideoId(@Param("userId") String userId, @Param("videoId") String videoId);
}