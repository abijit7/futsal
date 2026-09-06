package com.futsal.config;

import com.futsal.service.DemoDataService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Drives {@link DemoDataService}. Separate from it so that both calls go through the Spring proxy
 * and therefore run inside the service's transaction; a self-invoked {@code @Transactional} method
 * would silently run without one.
 */
@Component
@ConditionalOnProperty(prefix = "app.demo", name = "enabled", havingValue = "true")
public class DemoDataSeeder {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);

    private final DemoDataService demoDataService;

    public DemoDataSeeder(DemoDataService demoDataService) {
        this.demoDataService = demoDataService;
    }

    /**
     * Seeding failures must not stop the application: a demo without its sample venues is still a
     * working booking system, and crashing on startup over sample data would be worse.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void seedOnStartup() {
        log.warn("Demo mode is ENABLED: shared demo accounts are seeded and published by GET /api/demo.");
        runSeed();
    }

    /** The initial delay matches the interval so this never doubles up with the startup run. */
    @Scheduled(
            fixedDelayString = "${app.demo.refresh-interval-ms:21600000}",
            initialDelayString = "${app.demo.refresh-interval-ms:21600000}")
    public void refreshDemoData() {
        runSeed();
    }

    private void runSeed() {
        try {
            demoDataService.seed();
        } catch (RuntimeException ex) {
            log.error("Demo seeding failed; the application continues without refreshed demo data.", ex);
        }
    }
}
