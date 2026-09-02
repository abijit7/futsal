package com.futsal.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;

/**
 * HTTP client used for outbound payment-gateway calls.
 *
 * <p>Defined as a bean rather than built inside the service for two reasons: the timeouts are an
 * operational setting that belongs in configuration, and tests need to substitute a client bound
 * to {@code MockRestServiceServer}.
 *
 * <p>The timeouts are not optional. These calls run inside transactions holding a pessimistic lock
 * on the slot row, so an unbounded wait would pin a database connection and block every other
 * checkout for that slot until the socket eventually gave up.
 */
@Configuration
public class GatewayHttpConfig {

    @Bean
    public RestClient gatewayRestClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout((int) Duration.ofSeconds(10).toMillis());
        factory.setReadTimeout((int) Duration.ofSeconds(20).toMillis());
        return RestClient.builder().requestFactory(factory).build();
    }
}
