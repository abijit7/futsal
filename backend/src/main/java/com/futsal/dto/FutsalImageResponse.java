package com.futsal.dto;

import java.time.LocalDateTime;

public class FutsalImageResponse {
    private Long imageId;
    private String imageUrl;
    private Integer sortOrder;
    private boolean cover;
    private String caption;
    private LocalDateTime createdAt;

    public Long getImageId() { return imageId; }
    public void setImageId(Long imageId) { this.imageId = imageId; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }

    public boolean isCover() { return cover; }
    public void setCover(boolean cover) { this.cover = cover; }

    public String getCaption() { return caption; }
    public void setCaption(String caption) { this.caption = caption; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

