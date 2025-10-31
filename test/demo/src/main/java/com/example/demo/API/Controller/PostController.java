package com.example.demo.API.Controller;

import com.example.demo.Domain.Service.UploadService;
import com.example.demo.Domain.db.Video;
import com.example.demo.Domain.dto.UploadUrlDto;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.beans.factory.annotation.Value;

import com.fasterxml.jackson.databind.node.ObjectNode;

@RestController
@RequestMapping("/api")
public class PostController {

    private final UploadService uploadService;

    @Value("${aws.s3.bucket-name}")
    private String bucket;

    public PostController(UploadService uploadService) {
        this.uploadService = uploadService;
    }

    @PostMapping("/upload/skeleton")
    public ResponseEntity<UploadUrlDto> uploadSkeleton(@RequestBody ObjectNode data) {

        try {
            String userId = data.get("userId").asText();
            String videoName = data.get("videoName").asText();
            String joints = data.get("joints").toPrettyString();
            String fileExtension = data.get("fileExtension").asText();

            Video video = uploadService.uploadSkeleton(userId, videoName, joints);

            String objectName = userId + "-" + video.getVideoId() + "-" + videoName + fileExtension;

            String uploadUrl = uploadService
                    .createUploadUrl(userId, video.getVideoId(), bucket, objectName)
                    .getUploadUrl();

            UploadUrlDto response = new UploadUrlDto(bucket, objectName, uploadUrl);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
}