package com.futsal.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
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

    @Value("${app.upload.max-image-size-bytes:5242880}")
    private long maxImageSizeBytes;

    @Value("${app.upload.max-image-dimension:5000}")
    private int maxImageDimension;

    @Value("${app.upload.max-image-files:10}")
    private int maxImageFiles;

    @PostMapping("/futsal-image")
    public ResponseEntity<?> uploadFutsalImage(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("No file uploaded");
        }

        SanitizedImage image = sanitizeImage(file);
        String url = saveImage(image);
        Map<String, String> res = new HashMap<>();
        res.put("url", url);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/futsal-images")
    public ResponseEntity<?> uploadFutsalImages(@RequestParam("files") MultipartFile[] files) {
        if (files == null || files.length == 0) {
            throw new IllegalArgumentException("No files uploaded");
        }
        if (files.length > maxImageFiles) {
            throw new IllegalArgumentException("You can upload up to " + maxImageFiles + " images at once.");
        }

        List<SanitizedImage> sanitizedImages = new ArrayList<>();
        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) {
                continue;
            }
            sanitizedImages.add(sanitizeImage(file));
        }

        if (sanitizedImages.isEmpty()) {
            throw new IllegalArgumentException("No valid files uploaded");
        }

        List<String> urls = new ArrayList<>();
        for (SanitizedImage image : sanitizedImages) {
            urls.add(saveImage(image));
        }

        Map<String, Object> res = new HashMap<>();
        res.put("urls", urls);
        return ResponseEntity.ok(res);
    }

    private SanitizedImage sanitizeImage(MultipartFile file) {
        validateFile(file);

        String format = formatForContentType(file.getContentType());
        try {
            BufferedImage source = ImageIO.read(file.getInputStream());
            if (source == null) {
                throw new IllegalArgumentException("Uploaded file is not a readable image.");
            }
            if (source.getWidth() <= 0 || source.getHeight() <= 0) {
                throw new IllegalArgumentException("Uploaded image has invalid dimensions.");
            }
            if (source.getWidth() > maxImageDimension || source.getHeight() > maxImageDimension) {
                throw new IllegalArgumentException("Image dimensions cannot exceed " + maxImageDimension + "px.");
            }

            BufferedImage clean = redrawImage(source, format);
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            if (!ImageIO.write(clean, format, output)) {
                throw new IllegalArgumentException("Unsupported image format.");
            }
            byte[] bytes = output.toByteArray();
            if (bytes.length > maxImageSizeBytes) {
                throw new IllegalArgumentException("Processed image is too large.");
            }
            return new SanitizedImage(bytes, "." + format);
        } catch (IOException e) {
            throw new ApiServerException("Failed to process uploaded image.", e);
        }
    }

    private void validateFile(MultipartFile file) {
        if (file.getSize() <= 0) {
            throw new IllegalArgumentException("No file uploaded");
        }
        if (file.getSize() > maxImageSizeBytes) {
            throw new IllegalArgumentException("Image file cannot exceed " + bytesToMegabytes(maxImageSizeBytes) + " MB.");
        }
        formatForContentType(file.getContentType());
    }

    private BufferedImage redrawImage(BufferedImage source, String format) {
        boolean png = "png".equals(format);
        int imageType = png ? BufferedImage.TYPE_INT_ARGB : BufferedImage.TYPE_INT_RGB;
        BufferedImage clean = new BufferedImage(source.getWidth(), source.getHeight(), imageType);
        Graphics2D graphics = clean.createGraphics();
        try {
            graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            if (!png) {
                graphics.setColor(Color.WHITE);
                graphics.fillRect(0, 0, clean.getWidth(), clean.getHeight());
            }
            graphics.drawImage(source, 0, 0, null);
        } finally {
            graphics.dispose();
        }
        return clean;
    }

    private String saveImage(SanitizedImage image) {
        String filename = UUID.randomUUID() + image.extension();

        Path dirPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        Path targetPath = dirPath.resolve(filename).normalize();
        if (!targetPath.startsWith(dirPath)) {
            throw new IllegalArgumentException("Invalid upload path.");
        }

        try {
            Files.createDirectories(dirPath);
            Files.write(targetPath, image.bytes(), StandardOpenOption.CREATE_NEW);
            return ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/uploads/")
                    .path(filename)
                    .toUriString();
        } catch (IOException e) {
            throw new ApiServerException("Failed to save uploaded image.", e);
        }
    }

    private String formatForContentType(String contentType) {
        if ("image/jpeg".equalsIgnoreCase(contentType) || "image/jpg".equalsIgnoreCase(contentType)) {
            return "jpg";
        }
        if ("image/png".equalsIgnoreCase(contentType)) {
            return "png";
        }
        throw new IllegalArgumentException("Only JPEG and PNG images are allowed.");
    }

    private long bytesToMegabytes(long bytes) {
        return Math.max(1, bytes / (1024 * 1024));
    }

    private record SanitizedImage(byte[] bytes, String extension) {}
}
