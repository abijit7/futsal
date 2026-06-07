package com.futsal.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/uploads")
public class UploadController {

    @Value("${app.upload.dir}")
    private String uploadDir;

    @PostMapping("/futsal-image")
    public ResponseEntity<?> uploadFutsalImage(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(errorMap("No file uploaded"));
            }

            String url = saveFile(file);
            Map<String, String> res = new HashMap<>();
            res.put("url", url);
            return ResponseEntity.ok(res);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(errorMap("Failed to upload file"));
        }
    }

    @PostMapping("/futsal-images")
    public ResponseEntity<?> uploadFutsalImages(@RequestParam("files") MultipartFile[] files) {
        try {
            if (files == null || files.length == 0) {
                return ResponseEntity.badRequest().body(errorMap("No files uploaded"));
            }

            List<String> urls = new ArrayList<>();
            for (MultipartFile file : files) {
                if (file == null || file.isEmpty()) {
                    continue;
                }
                urls.add(saveFile(file));
            }

            if (urls.isEmpty()) {
                return ResponseEntity.badRequest().body(errorMap("No valid files uploaded"));
            }

            Map<String, Object> res = new HashMap<>();
            res.put("urls", urls);
            return ResponseEntity.ok(res);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(errorMap("Failed to upload files"));
        }
    }

    private String saveFile(MultipartFile file) throws IOException {
        String originalName = StringUtils.cleanPath(file.getOriginalFilename());
        String ext = "";
        int dot = originalName.lastIndexOf('.');
        if (dot >= 0) {
            ext = originalName.substring(dot);
        }

        String filename = UUID.randomUUID() + ext;
        Path dirPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(dirPath);

        Path targetPath = dirPath.resolve(filename);
        Files.copy(file.getInputStream(), targetPath);

        return ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/uploads/")
                .path(filename)
                .toUriString();
    }

    private Map<String, String> errorMap(String message) {
        Map<String, String> map = new HashMap<>();
        map.put("error", message);
        return map;
    }
}
