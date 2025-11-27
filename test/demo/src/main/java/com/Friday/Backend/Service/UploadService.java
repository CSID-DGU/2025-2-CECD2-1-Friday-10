package com.Friday.Backend.Service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.Friday.Backend.Domain.db.Frame;
import com.Friday.Backend.Domain.db.User;
import com.Friday.Backend.Domain.db.Video;
import com.Friday.Backend.Domain.repository.FrameRepository;
import com.Friday.Backend.Domain.repository.UserRepository;
import com.Friday.Backend.Domain.repository.VideoRepository;
import com.Friday.Backend.Dto.DownloadUrlDto;
import com.Friday.Backend.Dto.FrameDto;
import com.Friday.Backend.Dto.UploadUrlDto;

import java.util.Optional;

import jakarta.persistence.EntityNotFoundException;

@Transactional
@Service
public class UploadService {

    private final UserRepository userRepository;
    private final VideoRepository videoRepository;
    private final FrameRepository frameRepository;
    private final S3Service s3Service;
    private final VideoService videoService;

    public UploadService(
        UserRepository userRepository,
        VideoRepository videoRepository,
        FrameRepository frameRepository,
        S3Service s3Service,
        VideoService videoService) {
            this.userRepository = userRepository;
            this.videoRepository = videoRepository;
            this.frameRepository = frameRepository;
            this.s3Service = s3Service;
            this.videoService = videoService;
    }

    public Video uploadSkeleton(String userId, String videoName, String jointsJson) {
        User user = userRepository.findByUserId(userId).orElseGet(() -> {
            User newUser = new User();
            newUser.setUserId(userId);
            return userRepository.save(newUser);
        });

        long videoCount = videoRepository.countByUser(user);
        String newVideoId = String.format("%04d", videoCount + 1);

        Video video = new Video();
        video.setUser(user);
        video.setVideoId(newVideoId);
        video.setVideoName(videoName);
        video = videoRepository.save(video);

        Frame frame = new Frame();
        frame.setVideo(video);
        frame.setJoints(jointsJson);
        frameRepository.save(frame);

        return video;
    }

    public FrameDto getSkeleton(String userId, String videoId) {
        Optional<User> userOpt = userRepository.findByUserId(userId);

        if (userOpt.isEmpty()) {
            return null;
        }

        Optional<Video> videoOpt = videoRepository.findByVideoId(videoId)
            .filter(video -> video.getUser().getUserId().equals(userId));

        if (videoOpt.isEmpty()) {
            return null;
        }

        Frame frame = frameRepository.findByVideo(videoOpt.get()).orElse(null);
        if (frame == null) {
            return null;
        }

        return new FrameDto(videoId, frame.getJoints());
    }

    public UploadUrlDto createUploadUrl(
        String userId,
        String videoId,
        String bucket,
        String objectName
    )   
    throws Exception {
        String uploadUrl = s3Service.getUploadUrl(bucket, objectName);

        videoService.saveVideoMetadata(userId, videoId, objectName);

        return new UploadUrlDto(bucket, objectName, uploadUrl);
    }

    public DownloadUrlDto createDownloadUrl(String userId, String videoId, String bucket) {
    
    String objectName = videoRepository.findObjectNameByUserIdAndVideoId(userId, videoId)
        .orElseThrow(() -> new EntityNotFoundException("영상을 찾을 수 없습니다."));

    String downloadUrl;

    try {
        downloadUrl = s3Service.getDownloadUrl(bucket, objectName);
    }
    catch (Exception e) {
        throw new RuntimeException("S3 다운로드 URL 생성에 실패했습니다.", e);
    }

    return new DownloadUrlDto(bucket, objectName, downloadUrl);
}
}