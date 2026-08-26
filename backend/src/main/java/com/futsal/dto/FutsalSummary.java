package com.futsal.dto;

public class FutsalSummary {
    private Long futsalId;
    private String name;
    private java.math.BigDecimal hourlyPrice;

    public Long getFutsalId() { return futsalId; }
    public void setFutsalId(Long futsalId) { this.futsalId = futsalId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public java.math.BigDecimal getHourlyPrice() { return hourlyPrice; }
    public void setHourlyPrice(java.math.BigDecimal hourlyPrice) { this.hourlyPrice = hourlyPrice; }
}

