package com.app.seatbooking.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.sms")
@Getter
@Setter
public class SmsProperties {

    private boolean enabled = false;
    private boolean simulate = true;
    private String defaultCountryCode = "91";
    private int otpLength = 6;
    private int otpExpiryMinutes = 10;
}
