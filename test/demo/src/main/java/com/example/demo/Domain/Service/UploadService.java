package com.example.demo.Domain.Service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import com.example.demo.Domain.db.User;
import com.example.demo.Domain.db.Video;
import com.example.demo.Domain.db.Frame;
import com.example.demo.Domain.repository.UserRepository;
import com.example.demo.Domain.repository.VideoRepository;
import com.example.demo.Domain.repository.FrameRepository;
import com.example.demo.Domain.dto.FrameDto;
import com.example.demo.Domain.dto.UploadUrlDto;

@Transactional
@Service
public class UploadService {

    private final UserRepository userRepository;

    private final VideoRepository videoRepository;

    private final FrameRepository frameRepository;

    private final MinioService minioService;

    private final VideoService videoService;

    public UploadService(
        UserRepository userRepository,
        VideoRepository videoRepository,
        FrameRepository frameRepository,
        MinioService minioService,
        VideoService videoService) {
            this.userRepository = userRepository;
            this.videoRepository = videoRepository;
            this.frameRepository = frameRepository;
            this.minioService = minioService;
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

    public UploadUrlDto createUploadUrl(String userId, String videoId, String bucket, String objectName) throws Exception {
        String uploadUrl = minioService.getUploadUrl(bucket, objectName);
        System.out.println("upload url generated");

        videoService.saveVideoMetadata(userId, videoId, objectName);

        return new UploadUrlDto(bucket, objectName, uploadUrl);
    }

    public UploadUrlDto createDownloadUrl(String userId, String videoId, String bucket, String objectName) throws Exception {
        String downloadUrl = minioService.getDownloadUrl(bucket, objectName);
        System.out.println("download url generated");

        return new UploadUrlDto(bucket, objectName, downloadUrl);
    }
}