package com.futsal.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class UserUpdateRequest {
    @Size(min = 5, max = 50, message = "Name must be 5-50 characters")
    @Pattern(
        regexp = "^[A-Za-z]{2,}(?: [A-Za-z]{2,})+$",
        message = "Name must include first and last name (letters only)"
    )
    private String name;

    @Pattern(
        regexp = "^(98|97|96)\\d{8}$",
        message = "Phone must be 10 digits and start with 98, 97, or 96"
    )
    private String phone;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

}
