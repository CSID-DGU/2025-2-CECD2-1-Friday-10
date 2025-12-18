package com.Friday.Backend.Controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.Friday.Backend.Domain.db.Video;
import com.Friday.Backend.Dto.ScoreUploadDto;
import com.Friday.Backend.Dto.SkeletonUploadDto;
import com.Friday.Backend.Dto.UploadUrlDto;
import com.Friday.Backend.Service.EstimateService;
import com.Friday.Backend.Service.UploadService;

import org.springframework.beans.factory.annotation.Value;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api")
public class PostController {

    private final UploadService uploadService;
    private final EstimateService estimateService;

    @Value("${aws.s3.bucket-name}")
    private String bucket;

    public PostController(
        UploadService uploadService,
        EstimateService estimateService
    ) {
        this.uploadService = uploadService;
        this.estimateService = estimateService;
    }

    @PostMapping("/upload/skeleton")
    public ResponseEntity<UploadUrlDto> uploadSkeleton(@Valid @RequestBody SkeletonUploadDto requestDto) {
        String authenticatedUserId = SecurityContextHolder.getContext().getAuthentication().getName();
        
        try {

            Video video = uploadService.uploadSkeleton(
                authenticatedUserId,
                requestDto.getVideoName(),
                requestDto.getJoints().toString()
            );

            String objectName = authenticatedUserId + "-" + video.getVideoId() + "-" + requestDto.getVideoName() + requestDto.getFileExtension();

            String uploadUrl = uploadService
                .createUploadUrl(authenticatedUserId, video.getVideoId(), bucket, objectName)
                .getUploadUrl();

            UploadUrlDto response = new UploadUrlDto(bucket, objectName, uploadUrl);
            return ResponseEntity.ok(response);

        }
        catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "업로드 처리 중 오류가 발생했습니다.", e);
        }
    }

    @PostMapping("/score/videos/{videoId}/score")
    public ResponseEntity<String> saveScore(
        @PathVariable String videoId, 
        @Valid @RequestBody ScoreUploadDto requestDto
    ) {

        String authenticatedUserId = SecurityContextHolder.getContext().getAuthentication().getName();
        String score = requestDto.getScore();
        
        estimateService.saveScore(authenticatedUserId, videoId, score); 

        String message = String.format("점수 '%s'점 등록되었습니다.", score);
                                       
        return ResponseEntity.ok(message);
    }
}