package com.futsal.controller;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PageRequestFactoryTest {

    @Test
    void createsPageableWithinAllowedRange() {
        Pageable pageable = PageRequestFactory.create(2, PageRequestFactory.MAX_PAGE_SIZE);

        assertEquals(2, pageable.getPageNumber());
        assertEquals(PageRequestFactory.MAX_PAGE_SIZE, pageable.getPageSize());
    }

    @Test
    void rejectsInvalidPageValuesBeforePageRequestCreation() {
        assertThrows(IllegalArgumentException.class, () -> PageRequestFactory.create(-1, 10));
        assertThrows(IllegalArgumentException.class, () -> PageRequestFactory.create(0, 0));
        assertThrows(IllegalArgumentException.class, () -> PageRequestFactory.create(0, PageRequestFactory.MAX_PAGE_SIZE + 1));
    }
}
