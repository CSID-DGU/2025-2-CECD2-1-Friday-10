package com.example.demo.Domain.Service;

import org.springframework.stereotype.Service;

import java.util.stream.Collectors;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;

import com.example.demo.Domain.repository.VideoRepository;
import com.example.demo.Domain.db.Video;
import com.example.demo.Domain.dto.VideoListDto;

import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;

@Service
public class VideoService {

    private final VideoRepository videoRepository;
    private final S3Client s3Client;

    @Value("${aws.s3.bucket-name}")
    private String bucket;

    public VideoService(S3Client s3Client, VideoRepository videoRepository) {
        this.s3Client = s3Client;
        this.videoRepository = videoRepository;
    }

    public List<VideoListDto> getAllVideosByUser(String userId) {
        return videoRepository.findAllByUser_UserId(userId).stream()
                .map(video -> new VideoListDto(
                        video.getVideoId(),
                        video.getVideoName(),
                        video.getUploadTime()
                ))
                .collect(Collectors.toList());
    }

    public boolean deleteVideo(String userId, String videoId) {
        Optional<Video> videoOpt = videoRepository.findByVideoId(videoId)
                .filter(video -> video.getUser().getUserId().equals(userId));

        if (videoOpt.isPresent()) {
            Video video = videoOpt.get();

            try {
                if (video.getObjectName() != null) {

                    DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                            .bucket(bucket)
                            .key(video.getObjectName())
                            .build();
                    s3Client.deleteObject(deleteRequest);
                }

                videoRepository.delete(video);
                return true;
            } catch (Exception e) {
                e.printStackTrace();
                return false;
            }
        } else {
            return false;
        }
    }

    public void saveScore(String videoId, String score) {
        videoRepository.findByVideoId(videoId).ifPresent(video -> {
            video.setScore(score);
            videoRepository.save(video);
        });
    }

    public String getScore(String videoId) {
        return videoRepository.findByVideoId(videoId)
                .map(Video::getScore)
                .orElse(null);
    }

    public boolean saveVideoMetadata(String userId, String videoId, String objectName) {
        Optional<Video> videoOpt = videoRepository.findByVideoId(videoId)
                .filter(video -> video.getUser().getUserId().equals(userId));

        if (videoOpt.isPresent()) {
            Video video = videoOpt.get();
            video.setObjectName(objectName);
            videoRepository.save(video);
            return true;
        } else {
            return false;
        }
    }
}