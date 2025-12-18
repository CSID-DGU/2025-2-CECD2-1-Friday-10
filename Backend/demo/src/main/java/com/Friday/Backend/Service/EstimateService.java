package com.Friday.Backend.Service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.Friday.Backend.Domain.db.Video;
import com.Friday.Backend.Domain.repository.VideoRepository;

import java.util.Optional;

@Service
public class EstimateService {

    private final VideoRepository videoRepository;

    public EstimateService(
        VideoRepository videoRepository
        ) {
            this.videoRepository = videoRepository;
    }

    public String saveScore(String userId, String videoId, String score) {
    
        return videoRepository.findByVideoIdAndUserId(videoId, userId) 
        .map(video -> {
            video.setScore(score);
            videoRepository.save(video);
            
            return "점수를 등록했습니다.";
        })
        .orElseThrow(() -> {

             throw new ResponseStatusException(
                 HttpStatus.NOT_FOUND,
                 "영상이 없거나, 권한이 없습니다."
             );
        });
    }

    public String getScore(String userId, String videoId) {
        Optional<Video> videoOpt = videoRepository.findByVideoId(videoId)
        .filter(video -> video.getUser().getUserId().equals(userId));

        if (videoOpt.isEmpty()) {
            return null;
        }

        Video video = videoOpt.get();
        
        return video.getScore();
    }
}