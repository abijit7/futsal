package com.futsal.dto;

public class SlotGenerationResponse {
    private int created;
    private int skippedExisting;
    private int skippedBlocked;

    public SlotGenerationResponse(int created, int skippedExisting, int skippedBlocked) {
        this.created = created;
        this.skippedExisting = skippedExisting;
        this.skippedBlocked = skippedBlocked;
    }

    public int getCreated() { return created; }
    public void setCreated(int created) { this.created = created; }

    public int getSkippedExisting() { return skippedExisting; }
    public void setSkippedExisting(int skippedExisting) { this.skippedExisting = skippedExisting; }

    public int getSkippedBlocked() { return skippedBlocked; }
    public void setSkippedBlocked(int skippedBlocked) { this.skippedBlocked = skippedBlocked; }
}
