package com.example.demo.Domain.db;

import com.fasterxml.jackson.annotation.JsonManagedReference;

import jakarta.persistence.*;

@Entity
public class Frame {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    private String frameId;

    @OneToOne
    @JoinColumn(name = "video_id")
    @JsonManagedReference
    private Video video;

    @Lob
    private String joints;

    public Frame() {}
    
    public Frame(
        String frameId,
        Video video,
        String joints
    ) {
        this.frameId = frameId;
        this.video = video;
        this.joints = joints;
    }

    public long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFrameId() {
        return frameId;
    }

    public void setFrameId(String frameId) {
        this.frameId = frameId;
    }

    public Video getVideo() {
        return video;
    }

    public void setVideo(Video video) {
        this.video = video;
    }

    public String getJoints() {
        return joints;
    }

    public void setJoints(String joints) {
        this.joints = joints;
    }
}
