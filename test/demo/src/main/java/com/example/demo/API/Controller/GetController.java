package com.example.demo.API.Controller;

import com.example.demo.Domain.Service.UploadService;
import com.example.demo.Domain.Service.VideoService;
//import com.example.demo.Domain.db.Video;
import com.example.demo.Domain.Service.EstimateService;
import com.example.demo.Domain.dto.DownloadUrlDto;
import com.example.demo.Domain.dto.FrameDto;
import com.example.demo.Domain.dto.VideoListDto;
import com.example.demo.Domain.repository.VideoRepository;

import jakarta.persistence.EntityNotFoundException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@RestController
@RequestMapping("/api")
public class GetController {

    private final UploadService uploadService;

    private final EstimateService estimateService;

    private final VideoService videoService;

    private final VideoRepository videoRepository;

    @Value("${minio.bucket-name}")
    private String bucket;

    public GetController(
        UploadService uploadService,
        EstimateService estimateService,
        VideoService videoService,
        VideoRepository videoRepository
    ) {
        this.uploadService = uploadService;
        this.estimateService = estimateService;
        this.videoService = videoService;
        this.videoRepository = videoRepository;
    }

    @GetMapping("/skeleton/user/{userId}/video/{videoId}")
    public ResponseEntity<FrameDto> getSkeleton(@PathVariable String userId, @PathVariable String videoId) {
        FrameDto frameDto = uploadService.getSkeleton(userId, videoId);

        if (frameDto == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(frameDto);
    }

    @GetMapping("/score/user/{userId}/video/{videoId}")
    public ResponseEntity<String> getScore(@PathVariable String userId, @PathVariable String videoId) {
        String score = estimateService.getScore(userId, videoId);

        if (score == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(score);
    }

    @GetMapping("/estimate/user/{userId}/video/{videoId}")
    public ResponseEntity<String> requestEstimation(@PathVariable String userId, @PathVariable String videoId) {
        String result = estimateService.requestEstimate(userId, videoId);

        if (result == null) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Estimation failed or video not found");
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/skeleton/user/{userId}/videos")
    public ResponseEntity<List<VideoListDto>> getVideoList(@PathVariable String userId) {
        List<VideoListDto> videos = videoService.getAllVideosByUser(userId);
        return ResponseEntity.ok(videos);
    }

    @DeleteMapping("/delete/user/{userId}/video/{videoId}")
    public ResponseEntity<Void> deleteVideo(
        @PathVariable String userId,
        @PathVariable String videoId
    ) {
            boolean isDeleted = videoService.deleteVideo(userId, videoId);

            if (isDeleted) {
                return ResponseEntity.noContent().build();
            }
            else {
                return ResponseEntity.notFound().build();
            }
    }

    @GetMapping("/download/user/{userId}/video/{videoId}")
    public ResponseEntity<DownloadUrlDto> getDownloadUrl(
        @PathVariable String userId,
        @PathVariable String videoId
    ) {
        
        try {
            String objectName = videoRepository.findObjectNameByUserIdAndVideoId(userId, videoId)
            .orElseThrow(() -> new EntityNotFoundException("video not found"));

            System.out.println(objectName);

            String videoName = objectName.substring(objectName.lastIndexOf("/") + 1);
            System.out.println(videoName);

            String downloadUrl = uploadService
            .createDownloadUrl(userId, videoId, bucket, objectName)
            .getUploadUrl();

            System.out.println(downloadUrl);
            DownloadUrlDto response = new DownloadUrlDto(bucket, videoName, downloadUrl);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
}