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
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/uploads")
@CrossOrigin(origins = "*")
public class UploadController {

    @Value("${app.upload.dir}")
    private String uploadDir;

    @PostMapping("/futsal-image")
    public ResponseEntity<?> uploadFutsalImage(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(errorMap("No file uploaded"));
            }

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

            Map<String, String> res = new HashMap<>();
            String url = ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/uploads/")
                    .path(filename)
                    .toUriString();
            res.put("url", url);
            return ResponseEntity.ok(res);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(errorMap("Failed to upload file"));
        }
    }

    private Map<String, String> errorMap(String message) {
        Map<String, String> map = new HashMap<>();
        map.put("error", message);
        return map;
    }
}
