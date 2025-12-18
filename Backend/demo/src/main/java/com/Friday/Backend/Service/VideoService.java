package com.Friday.Backend.Service;

import org.springframework.stereotype.Service;

import java.util.stream.Collectors;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;

import software.amazon.awssdk.core.exception.SdkClientException;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;

import org.springframework.transaction.annotation.Transactional;

import com.Friday.Backend.Domain.db.Video;
import com.Friday.Backend.Domain.repository.UserRepository;
import com.Friday.Backend.Domain.repository.VideoRepository;
import com.Friday.Backend.Dto.VideoListDto;

@Service
public class VideoService {

    private final UserRepository userRepository;
    private final VideoRepository videoRepository;
    private final S3Client s3Client;

    @Value("${aws.s3.bucket-name}")
    private String bucket;

    public VideoService(S3Client s3Client, UserRepository userRepository, VideoRepository videoRepository) {
        this.s3Client = s3Client;
        this.userRepository = userRepository;
        this.videoRepository = videoRepository;
    }

    @Transactional(readOnly = true)
    public List<VideoListDto> getAllVideosByUser(String userId) {
        return videoRepository.findAllByUser_UserId(userId).stream()
        .map(video -> new VideoListDto(
            video.getVideoId(),
            video.getVideoName(),
            video.getUploadTime()
        ))
        .collect(Collectors.toList());
    }

    @Transactional
    public boolean deleteVideo(String userId, String videoId) {
        Optional<Video> videoOpt = videoRepository.findByVideoId(videoId)
        .filter(video -> video.getUser().getUserId().equals(userId));

        if (videoOpt.isPresent()) {
            Video video = videoOpt.get();

            if (video.getObjectName() != null) {
                try {
                    DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                    .bucket(bucket)
                    .key(video.getObjectName())
                    .build();

                    s3Client.deleteObject(deleteRequest);
                }
                catch (SdkClientException e) {
                    System.err.println("S3 삭제 실패 (객체 키: " + video.getObjectName() + "): " + e.getMessage());
                    return false;
                }
            }

            videoRepository.delete(video);
            return true;
        }
        else {
            return false;
        }
    }

    @Transactional
    public boolean deleteUser(String userId) {
        return userRepository.findByUserId(userId)
        .map(user -> {
            List<Video> videosToDelete = videoRepository.findAllByUser_UserId(userId);

            for (Video video : videosToDelete) {
                if (video.getObjectName() != null) {
                    try {
                        DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                        .bucket(bucket)
                        .key(video.getObjectName())
                        .build();

                        s3Client.deleteObject(deleteRequest);
                    }
                    catch (SdkClientException e) {
                        System.err.println("사용자[" + userId + "]의 S3 객체 삭제 실패: " + e.getMessage());
                    }
                }
            }
                
            videoRepository.deleteAll(videosToDelete);
                
            userRepository.delete(user);
            return true;
        })
        .orElse(false);
    }

    public boolean saveVideoMetadata(String userId, String videoId, String objectName) {
        Optional<Video> videoOpt = videoRepository.findByVideoId(videoId)
        .filter(video -> video.getUser().getUserId().equals(userId));

        if (videoOpt.isPresent()) {
            Video video = videoOpt.get();
            video.setObjectName(objectName);
            videoRepository.save(video);

            return true;
        }
        else {
            return false;
        }
    }
}