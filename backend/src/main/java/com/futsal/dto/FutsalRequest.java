package com.futsal.dto;

import jakarta.validation.constraints.DecimalMin;
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

    private String imageUrl;

    private List<String> imageUrls;

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

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public List<String> getImageUrls() { return imageUrls; }
    public void setImageUrls(List<String> imageUrls) { this.imageUrls = imageUrls; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}

