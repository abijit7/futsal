package com.futsal.dto;

import jakarta.validation.constraints.NotNull;

/**
 * Body of {@code PUT /api/futsals/{id}/verification}.
 *
 * <p>Verification is a platform decision about a venue, so it gets its own admin-only endpoint
 * rather than riding along in {@link FutsalRequest}. Keeping it out of the venue body means an
 * approval can never be smuggled in alongside an ordinary edit.
 *
 * <p>{@code Boolean} rather than {@code boolean} so that an omitted field fails validation instead
 * of silently un-verifying the venue.
 */
public class FutsalVerificationRequest {

    @NotNull(message = "verified is required")
    private Boolean verified;

    public Boolean getVerified() { return verified; }
    public void setVerified(Boolean verified) { this.verified = verified; }
}
