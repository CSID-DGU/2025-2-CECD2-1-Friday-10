package com.example.demo.Domain.db;

import jakarta.persistence.*;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonManagedReference;

import java.util.ArrayList;

@Entity
@Table(name = "app_user")
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String userId;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @JsonManagedReference
    private List<Video> videos;

    public User() {}
    
    public User(String userId) {
        this.userId = userId;
        this.videos = new ArrayList<>();
    }

    public User(
        String userId,
        List<Video> videos
    ) {
        this.userId = userId;
        this.videos = videos;
    }

    public long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public List<Video> getVideos(){
        return videos;
    }

    public void setVideos(List<Video> videos) {
        this.videos = videos;
    }
}
