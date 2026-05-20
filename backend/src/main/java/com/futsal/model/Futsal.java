package com.futsal.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.time.LocalTime;
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

    @Size(max = 250, message = "Description must be up to 250 characters")
    @Column(length = 250)
    private String description;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "futsal", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<TimeSlot> timeSlots;

    public Futsal() {}

    public Futsal(String name, String address, String city, String phone, java.math.BigDecimal hourlyPrice, LocalTime openingTime, String description) {
        this.name = name;
        this.address = address;
        this.city = city;
        this.phone = phone;
        this.hourlyPrice = hourlyPrice;
        this.openingTime = openingTime;
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

    public String getDescription()               { return description; }
    public void setDescription(String description){ this.description = description; }

    public LocalDateTime getCreatedAt()          { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt){ this.createdAt = createdAt; }
}
