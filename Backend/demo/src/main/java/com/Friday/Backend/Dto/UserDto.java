package com.Friday.Backend.Dto;

import java.util.List;

import com.Friday.Backend.Domain.db.User;

public class UserDto {
    private long id;
    private String userId;
    private List<VideoDto> videos;

    public UserDto(User user) {
        this.id = user.getId();
        this.userId = user.getUserId();
        this.videos = user.getVideos()
                    .stream()
                    .map(VideoDto::new)
                    .toList();
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public List<VideoDto> getVideos() {
        return videos;
    }
    
    public void setVideos(List<VideoDto> videos) {
        this.videos = videos;
    }
}
