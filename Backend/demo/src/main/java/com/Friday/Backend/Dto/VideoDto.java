package com.Friday.Backend.Dto;

import com.Friday.Backend.Domain.db.Video;

public class VideoDto {
    private String videoId;
    private String videoName;
    private FrameDto frame;
    private String score;
    
    public VideoDto(Video video) {
        this.videoId = video.getVideoId();
        this.videoName = video.getVideoName();

        if (video.getFrame() != null) {
            this.frame = new FrameDto(video.getFrame());
        } else {
            this.frame = null;
        }

        this.score = video.getScore();
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

    public FrameDto getFrame() {
        return frame;
    }

    public void setFrame(FrameDto frame) {
        this.frame = frame;
    }

    public String getScore() {
        return score;
    }

    public void setScore(String score) {
        this.score = score;
    }
}