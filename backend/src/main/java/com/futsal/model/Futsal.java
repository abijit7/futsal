package com.futsal.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "futsals")
public class Futsal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long futsalId;

    @NotBlank(message = "Futsal name is required")
    @Size(min = 3, max = 80, message = "Name must be 3-80 characters")
    @Column(nullable = false)
    private String name;

    @NotBlank(message = "Address is required")
    @Size(min = 5, max = 120, message = "Address must be 5-120 characters")
    @Column(nullable = false)
    private String address;

    @NotBlank(message = "City is required")
    @Size(min = 2, max = 50, message = "City must be 2-50 characters")
    @Column(nullable = false)
    private String city;

    @NotBlank(message = "Phone is required")
    @Pattern(
        regexp = "^(98|97|96)\\d{8}$",
        message = "Phone must be 10 digits and start with 98, 97, or 96"
    )
    @Column(nullable = false)
    private String phone;

    @DecimalMin(value = "0.0", inclusive = false, message = "Hourly price must be positive")
    @Column(nullable = false, precision = 10, scale = 2)
    private java.math.BigDecimal hourlyPrice;

    @NotNull(message = "Opening time is required")
    @Column(nullable = false)
    private LocalTime openingTime;

    @NotNull(message = "Closing time is required")
    @Column(nullable = false, columnDefinition = "time default '23:00:00'")
    private LocalTime closingTime = LocalTime.of(23, 0);

    @Column(length = 300)
    private String imageUrl;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean verified = false;

    @Size(max = 60, message = "Court type must be up to 60 characters")
    @Column(length = 60)
    private String courtType;

    @DecimalMin(value = "0.0", message = "Rating cannot be negative")
    @DecimalMax(value = "5.0", message = "Rating cannot be above 5")
    @Column(precision = 2, scale = 1)
    private java.math.BigDecimal rating;

    @Min(value = 0, message = "Review count cannot be negative")
    @Column(nullable = false, columnDefinition = "integer default 0")
    private Integer reviewCount = 0;

    @OneToMany(mappedBy = "futsal", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<FutsalImage> images = new ArrayList<>();

    @Transient
    private List<String> imageUrls = new ArrayList<>();

    @Size(max = 250, message = "Description must be up to 250 characters")
    @Column(length = 250)
    private String description;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "futsal", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<TimeSlot> timeSlots;

    public Futsal() {}

    public Futsal(String name, String address, String city, String phone, java.math.BigDecimal hourlyPrice, LocalTime openingTime, String imageUrl, String description) {
        this.name = name;
        this.address = address;
        this.city = city;
        this.phone = phone;
        this.hourlyPrice = hourlyPrice;
        this.openingTime = openingTime;
        this.closingTime = LocalTime.of(23, 0);
        this.imageUrl = imageUrl;
        this.description = description;
    }

    public Long getFutsalId()                    { return futsalId; }
    public void setFutsalId(Long futsalId)       { this.futsalId = futsalId; }

    public String getName()                      { return name; }
    public void setName(String name)             { this.name = name; }

    public String getAddress()                   { return address; }
    public void setAddress(String address)       { this.address = address; }

    public String getCity()                      { return city; }
    public void setCity(String city)             { this.city = city; }

    public String getPhone()                     { return phone; }
    public void setPhone(String phone)           { this.phone = phone; }

    public java.math.BigDecimal getHourlyPrice() { return hourlyPrice; }
    public void setHourlyPrice(java.math.BigDecimal hourlyPrice){ this.hourlyPrice = hourlyPrice; }

    public LocalTime getOpeningTime()          { return openingTime; }
    public void setOpeningTime(LocalTime openingTime){ this.openingTime = openingTime; }

    public LocalTime getClosingTime()          { return closingTime; }
    public void setClosingTime(LocalTime closingTime){ this.closingTime = closingTime; }

    public String getImageUrl()                { return imageUrl; }
    public void setImageUrl(String imageUrl)   { this.imageUrl = imageUrl; }

    public boolean isVerified()                { return verified; }
    public void setVerified(boolean verified)  { this.verified = verified; }

    public String getCourtType()               { return courtType; }
    public void setCourtType(String courtType) { this.courtType = courtType; }

    public java.math.BigDecimal getRating()    { return rating; }
    public void setRating(java.math.BigDecimal rating) { this.rating = rating; }

    public Integer getReviewCount()            { return reviewCount; }
    public void setReviewCount(Integer reviewCount) { this.reviewCount = reviewCount; }

    public List<FutsalImage> getImages()                  { return images; }
    public void setImages(List<FutsalImage> images)       { this.images = images; }

    public List<String> getImageUrls() {
        if (images != null && !images.isEmpty()) {
            return images.stream().map(FutsalImage::getImageUrl).toList();
        }
        return imageUrls;
    }
    public void setImageUrls(List<String> imageUrls)      { this.imageUrls = imageUrls; }

    public String getDescription()               { return description; }
    public void setDescription(String description){ this.description = description; }

    public LocalDateTime getCreatedAt()          { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt){ this.createdAt = createdAt; }
}
