package com.futsal.controller;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

public final class PageRequestFactory {

    public static final int MAX_PAGE_SIZE = 200;

    private PageRequestFactory() {
    }

    public static Pageable create(int page, int size) {
        if (page < 0) {
            throw new IllegalArgumentException("Page number cannot be negative.");
        }
        if (size < 1) {
            throw new IllegalArgumentException("Page size must be at least 1.");
        }
        if (size > MAX_PAGE_SIZE) {
            throw new IllegalArgumentException("Page size cannot exceed " + MAX_PAGE_SIZE + ".");
        }
        return PageRequest.of(page, size);
    }
}
