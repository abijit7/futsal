package com.futsal.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

/**
 * Serves uploaded venue images from {@code app.upload.dir} at {@code /uploads/**}.
 *
 * <p>Was previously called CorsConfig and lived in the controller package, despite doing no CORS -
 * that is handled by {@code SecurityConfig.corsFilter}.
 *
 * <p>On Azure App Service and Container Apps the local filesystem is ephemeral and not shared
 * between instances, so {@code app.upload.dir} must point at a mounted Azure Files share (or the
 * images must move to Blob Storage) for uploads to survive a restart or scale-out.
 */
@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String location = "file:" + Paths.get(uploadDir).toAbsolutePath().normalize() + "/";
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(location);
    }
}
