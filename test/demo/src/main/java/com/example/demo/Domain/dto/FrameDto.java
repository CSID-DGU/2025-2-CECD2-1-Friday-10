package com.example.demo.Domain.dto;

import com.example.demo.Domain.db.Frame;

public class FrameDto {
    private String videoId;
    private String joints;

    public FrameDto(Frame frame) {
        if (frame != null) {
            this.joints = frame.getJoints();
        }
    }

    public FrameDto(String videoId, String joints) {
        this.videoId = videoId;
        this.joints = joints;
    }

    public String getVideoId() {
        return videoId;
    }

    public void setVideoId(String videoId) {
        this.videoId = videoId;
    }

    public String getJoints() {
        return joints;
    }

    public void setJoints(String joints) {
        this.joints = joints;
    }
}