package com.example.demo.Domain.Service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.HashMap;
import java.util.Optional;

import com.example.demo.Domain.db.Video;
import com.example.demo.Domain.dto.FrameDto;
import com.example.demo.Domain.repository.VideoRepository;

@Service
public class EstimateService {

    private static final String ML_SERVER_URL = "ml_server_url";

    private final UploadService uploadService;

    private final VideoRepository videoRepository;

    private final RestTemplate restTemplate;

    public EstimateService(
        UploadService uploadService,
        VideoRepository videoRepository,
        RestTemplate restTemplate) {
            this.uploadService = uploadService;
            this.videoRepository = videoRepository;
            this.restTemplate = restTemplate;
    }

    public String requestEstimate(String userId, String videoId) {

        FrameDto frameDto = uploadService.getSkeleton(userId, videoId);

        if (frameDto == null) {
            return null;
        }

        try {
            String jointsJson = frameDto.getJoints();
            Map<String, String> requestBody = new HashMap<>();
            requestBody.put("videoId", videoId);
            requestBody.put("joints", jointsJson);

            String score = restTemplate.postForObject(ML_SERVER_URL, requestBody, String.class);

            saveScore(videoId, score);

            return score;

        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public void saveScore(String videoId, String score) {
        videoRepository.findByVideoId(videoId).ifPresent(video -> {
            video.setScore(score);
            videoRepository.save(video);
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