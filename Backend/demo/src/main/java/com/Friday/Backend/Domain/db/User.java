package com.Friday.Backend.Domain.db;

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
    private String password;
    private String email;

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

    public User(
        String userId,
        String password,
        String email
    ) {
        this.userId = userId;
        this.password = password;
        this.email = email;
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

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String GetEmail() {
        return email;
    }

    public void SetEmail(String email) {
        this.email = email;
    }

    public List<Video> getVideos(){
        return videos;
    }

    public void setVideos(List<Video> videos) {
        this.videos = videos;
    }
}
