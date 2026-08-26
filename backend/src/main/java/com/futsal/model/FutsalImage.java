package com.futsal.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Entity
@Table(name = "futsal_images")
public class FutsalImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long imageId;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "futsal_id", nullable = false)
    private Futsal futsal;

    @NotBlank
    @Column(nullable = false, length = 300)
    private String imageUrl;

    @Column(nullable = false)
    private Integer sortOrder = 0;

    @Column(nullable = false)
    private boolean cover = false;

    @Column(length = 120)
    private String caption;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public FutsalImage() {}

    public FutsalImage(Futsal futsal, String imageUrl, Integer sortOrder, boolean cover) {
        this.futsal = futsal;
        this.imageUrl = imageUrl;
        this.sortOrder = sortOrder;
        this.cover = cover;
    }

    public Long getImageId() { return imageId; }
    public void setImageId(Long imageId) { this.imageId = imageId; }

    public Futsal getFutsal() { return futsal; }
    public void setFutsal(Futsal futsal) { this.futsal = futsal; }

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

