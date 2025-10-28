package com.example.demo.Domain.Service;

import org.springframework.stereotype.Service;

import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;

import com.example.demo.Domain.repository.VideoRepository;

import io.minio.MinioClient;
import io.minio.RemoveObjectArgs;

import com.example.demo.Domain.db.Video;
import com.example.demo.Domain.dto.VideoListDto;

import java.util.List;
import java.util.Optional;

@Service
public class VideoService {

    private final VideoRepository videoRepository;

    private final MinioClient minioClient;

    @Value("${minio.bucket-name}")
    private String bucket;

    public VideoService(MinioClient minioClient, VideoRepository videoRepository) {
        this.minioClient = minioClient;
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
                    minioClient.removeObject(
                        RemoveObjectArgs.builder()
                        .bucket(bucket)
                        .object(video.getObjectName())
                        .build()
                        );
                    }
                    videoRepository.delete(video);
                    return true;
                } catch (Exception e) {
                    e.printStackTrace();
                    return false;
                }
            }
            else {
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
            .map(video -> video.getScore())
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