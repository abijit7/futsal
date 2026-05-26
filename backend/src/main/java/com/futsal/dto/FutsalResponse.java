package com.futsal.dto;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

public class FutsalResponse {
    private Long futsalId;
    private String name;
    private String address;
    private String city;
    private String phone;
    private java.math.BigDecimal hourlyPrice;
    private LocalTime openingTime;
    private String imageUrl;
    private List<String> imageUrls;
    private String description;
    private LocalDateTime createdAt;

    public Long getFutsalId() { return futsalId; }
    public void setFutsalId(Long futsalId) { this.futsalId = futsalId; }

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

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public List<String> getImageUrls() { return imageUrls; }
    public void setImageUrls(List<String> imageUrls) { this.imageUrls = imageUrls; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

