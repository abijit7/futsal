package com.futsal.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalTime;
import java.util.List;

public class FutsalRequest {

    @NotBlank(message = "Futsal name is required")
    @Size(min = 3, max = 80, message = "Name must be 3-80 characters")
    private String name;

    @NotBlank(message = "Address is required")
    @Size(min = 5, max = 120, message = "Address must be 5-120 characters")
    private String address;

    @NotBlank(message = "City is required")
    @Size(min = 2, max = 50, message = "City must be 2-50 characters")
    private String city;

    @NotBlank(message = "Phone is required")
    @Pattern(
        regexp = "^(98|97|96)\\d{8}$",
        message = "Phone must be 10 digits and start with 98, 97, or 96"
    )
    private String phone;

    @DecimalMin(value = "0.0", inclusive = false, message = "Hourly price must be positive")
    private java.math.BigDecimal hourlyPrice;

    @NotNull(message = "Opening time is required")
    private LocalTime openingTime;

    @NotNull(message = "Closing time is required")
    private LocalTime closingTime;

    private String imageUrl;

    private List<String> imageUrls;

    private boolean verified;

    @Size(max = 60, message = "Court type must be up to 60 characters")
    private String courtType;

    @DecimalMin(value = "0.0", message = "Rating cannot be negative")
    @DecimalMax(value = "5.0", message = "Rating cannot be above 5")
    private java.math.BigDecimal rating;

    @Min(value = 0, message = "Review count cannot be negative")
    private Integer reviewCount;

    @Size(max = 250, message = "Description must be up to 250 characters")
    private String description;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public java.math.BigDecimal getHourlyPrice() { return hourlyPrice; }
    public void setHourlyPrice(java.math.BigDecimal hourlyPrice) { this.hourlyPrice = hourlyPrice; }

    public LocalTime getOpeningTime() { return openingTime; }
    public void setOpeningTime(LocalTime openingTime) { this.openingTime = openingTime; }

    public LocalTime getClosingTime() { return closingTime; }
    public void setClosingTime(LocalTime closingTime) { this.closingTime = closingTime; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public List<String> getImageUrls() { return imageUrls; }
    public void setImageUrls(List<String> imageUrls) { this.imageUrls = imageUrls; }

    public boolean isVerified() { return verified; }
    public void setVerified(boolean verified) { this.verified = verified; }

    public String getCourtType() { return courtType; }
    public void setCourtType(String courtType) { this.courtType = courtType; }

    public java.math.BigDecimal getRating() { return rating; }
    public void setRating(java.math.BigDecimal rating) { this.rating = rating; }

    public Integer getReviewCount() { return reviewCount; }
    public void setReviewCount(Integer reviewCount) { this.reviewCount = reviewCount; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
