package com.futsal.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class UserRegisterRequest {
    @NotBlank(message = "Name is required")
    @Size(min = 5, max = 50, message = "Name must be 5-50 characters")
    @Pattern(
        regexp = "^[A-Za-z]{2,}(?: [A-Za-z]{2,})+$",
        message = "Name must include first and last name (letters only)"
    )
    private String name;

    @Email(message = "Invalid email format")
    @NotBlank(message = "Email is required")
    @Pattern(
        regexp = "^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\\.[A-Za-z0-9-]+)*\\.[A-Za-z]{2,}$",
        message = "Enter a valid email address, like you@gmail.com."
    )
    private String email;

    @NotBlank(message = "Phone is required")
    @Pattern(
        regexp = "^(98|97|96)\\d{8}$",
        message = "Phone must be 10 digits and start with 98, 97, or 96"
    )
    private String phone;

    @NotBlank(message = "Password is required")
    // 8 matches the reset and change-password endpoints; 72 is where BCrypt stops reading.
    @Size(min = 8, max = 72, message = "Use at least 8 characters.")
    @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$", message = "Use at least one letter and one number.")
    private String password;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}

