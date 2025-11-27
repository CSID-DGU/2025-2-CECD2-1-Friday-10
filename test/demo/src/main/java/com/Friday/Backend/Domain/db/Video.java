package com.Friday.Backend.Domain.db;

import jakarta.persistence.*;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonManagedReference;

@Entity
public class Video {
    
    @Id
    private String videoId;

    private String videoName;
    private String Score;
    private String objectName;

    private LocalDateTime uploadTime;
    
    @ManyToOne
    @JoinColumn(name = "user_id")
    @JsonManagedReference
    private User user;

    @OneToOne(mappedBy = "video", cascade = CascadeType.ALL)
    @JsonManagedReference
    private Frame frame;

    public Video() {}

    @PrePersist
    protected void onCreate() {
        this.uploadTime = LocalDateTime.now();
    }

    public Video(
        String videoId,
        String videoName,
        String Score,
        User user,
        Frame frame
    ) {
        this.videoId = videoId;
        this.videoName = videoName;
        this.Score = Score;
        this.user = user;
        this.frame = frame;
    }

    public String getVideoId() {
        return videoId;
    }

    public void setVideoId(String videoId) {
        this.videoId = videoId;
    }

    public String getVideoName() {
        return videoName;
    }

    public void setVideoName(String videoName) {
        this.videoName = videoName;
    }

    public String getScore() {
        return Score;
    }

    public void setScore(String Score) {
        this.Score = Score;
    }

    public LocalDateTime getUploadTime() {
        return uploadTime;
    }

    public void setUploadTime(LocalDateTime uploadTime) {
        this.uploadTime = uploadTime;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Frame getFrame() {
        return frame;
    }

    public void setFrame(Frame frame) {
        this.frame = frame;
    }

    public String getObjectName() {
        return objectName;
    }

    public void setObjectName(String objectName) {
        this.objectName = objectName;
    }
}