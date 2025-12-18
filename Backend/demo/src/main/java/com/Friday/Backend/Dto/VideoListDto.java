package com.Friday.Backend.Dto;

import java.time.LocalDateTime;

public class VideoListDto {
    private String videoId;
    private String videoName;
    private LocalDateTime uploadTime;

    public VideoListDto(String videoId, String videoName, LocalDateTime uploadTime) {
        this.videoId = videoId;
        this.videoName = videoName;
        this.uploadTime = uploadTime;
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

    public LocalDateTime getUploadTime() {
        return uploadTime;
    }

    public void setUploadTime(LocalDateTime uploadTime) {
        this.uploadTime = uploadTime;
    }
}