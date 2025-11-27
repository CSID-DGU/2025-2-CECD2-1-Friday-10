package com.Friday.Backend.Controller;

import jakarta.persistence.EntityNotFoundException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.Friday.Backend.Dto.DownloadUrlDto;
import com.Friday.Backend.Dto.FrameDto;
import com.Friday.Backend.Dto.VideoListDto;
import com.Friday.Backend.Service.EstimateService;
import com.Friday.Backend.Service.UploadService;
import com.Friday.Backend.Service.VideoService;

import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@RestController
@RequestMapping("/api")
public class GetController {

    private final UploadService uploadService;
    private final EstimateService estimateService;
    private final VideoService videoService;

    private final String bucket;

    public GetController(
        UploadService uploadService,
        EstimateService estimateService,
        VideoService videoService,
        @Value("${aws.s3.bucket-name}") String bucket
    ) {
        this.uploadService = uploadService;
        this.estimateService = estimateService;
        this.videoService = videoService;
        this.bucket = bucket;
    }

    @GetMapping("/skeleton/videos/{videoId}")
    public ResponseEntity<FrameDto> getSkeleton(@PathVariable String videoId) {
        String authenticatedUserId = SecurityContextHolder.getContext().getAuthentication().getName();

        FrameDto frameDto = uploadService.getSkeleton(authenticatedUserId, videoId);

        if (frameDto == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(frameDto);
    }

    @GetMapping("/score/videos/{videoId}")
    public ResponseEntity<String> getScore(@PathVariable String videoId) {
        String authenticatedUserId = SecurityContextHolder.getContext().getAuthentication().getName();

        String score = estimateService.getScore(authenticatedUserId, videoId);

        if (score == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(score);
    }
    
    @GetMapping("/videos")
    public ResponseEntity<List<VideoListDto>> getVideoList() {
        String authenticatedUserId = SecurityContextHolder.getContext().getAuthentication().getName();

        List<VideoListDto> videos = videoService.getAllVideosByUser(authenticatedUserId);

        return ResponseEntity.ok(videos);
    }

    @DeleteMapping("/videos/{videoId}")
    public ResponseEntity<Void> deleteVideo(@PathVariable String videoId) {
        String authenticatedUserId = SecurityContextHolder.getContext().getAuthentication().getName();

        boolean isDeleted = videoService.deleteVideo(authenticatedUserId, videoId);

        if (isDeleted) {
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/download/videos/{videoId}")
    public ResponseEntity<DownloadUrlDto> getDownloadUrl(@PathVariable String videoId) {
        String authenticatedUserId = SecurityContextHolder.getContext().getAuthentication().getName();

        try {
            DownloadUrlDto response = uploadService.createDownloadUrl(authenticatedUserId, videoId, bucket);
            return ResponseEntity.ok(response);

        }
        catch (EntityNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "비디오를 찾을 수 없습니다.", e);
        }
        catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "다운로드 URL 생성 중 오류가 발생했습니다.", e);
        }
    }
}