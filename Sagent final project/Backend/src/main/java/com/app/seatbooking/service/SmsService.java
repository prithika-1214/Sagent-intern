package com.app.seatbooking.service;

import com.app.seatbooking.config.SmsProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Service
public class SmsService {

    private static final Logger LOGGER = LoggerFactory.getLogger(SmsService.class);

    private final SmsProperties smsProperties;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${twilio.account-sid:}")
    private String twilioAccountSid;

    @Value("${twilio.auth-token:}")
    private String twilioAuthToken;

    @Value("${twilio.from-number:}")
    private String twilioFromNumber;

    public SmsService(SmsProperties smsProperties) {
        this.smsProperties = smsProperties;
    }

    public void sendSms(Long mobileNumber, String message) {
        String toNumber = formatMobileNumber(mobileNumber);

        if (!smsProperties.isEnabled()) {
            LOGGER.info("SMS disabled. OTP not sent to {}", toNumber);
            return;
        }

        if (smsProperties.isSimulate()) {
            LOGGER.info("Simulated SMS to {}: {}", toNumber, message);
            return;
        }

        if (!StringUtils.hasText(twilioAccountSid)
                || !StringUtils.hasText(twilioAuthToken)
                || !StringUtils.hasText(twilioFromNumber)) {
            throw new IllegalArgumentException("Twilio SMS configuration is incomplete");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.setBasicAuth(twilioAccountSid, twilioAuthToken);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("To", toNumber);
        body.add("From", twilioFromNumber);
        body.add("Body", message);

        HttpEntity<MultiValueMap<String, String>> requestEntity = new HttpEntity<>(body, headers);
        String url = "https://api.twilio.com/2010-04-01/Accounts/" + twilioAccountSid + "/Messages.json";

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, requestEntity, String.class);
            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new IllegalArgumentException("Unable to send OTP via SMS right now");
            }
        } catch (HttpStatusCodeException exception) {
            LOGGER.warn("Twilio SMS request failed with status {} and body {}", exception.getStatusCode(), exception.getResponseBodyAsString());
            throw new IllegalArgumentException(resolveTwilioMessage(exception.getResponseBodyAsString()));
        } catch (RestClientException exception) {
            throw new IllegalArgumentException("Unable to send OTP via SMS right now");
        }
    }

    private String formatMobileNumber(Long mobileNumber) {
        String digits = String.valueOf(mobileNumber == null ? "" : mobileNumber).replaceAll("\\D", "");
        if (!StringUtils.hasText(digits)) {
            throw new IllegalArgumentException("Mobile number is required");
        }

        String countryCode = String.valueOf(smsProperties.getDefaultCountryCode() == null
                ? ""
                : smsProperties.getDefaultCountryCode()).replaceAll("\\D", "");

        if (!StringUtils.hasText(countryCode)) {
            return "+" + digits;
        }

        if (digits.startsWith(countryCode) && digits.length() > 10) {
            return "+" + digits;
        }

        return "+" + countryCode + digits;
    }

    private String resolveTwilioMessage(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            int code = root.path("code").asInt();
            String message = root.path("message").asText("");

            if (code == 21608) {
                return "Twilio trial account can send SMS only to verified numbers. Verify this mobile number in Twilio or upgrade the account.";
            }

            if (StringUtils.hasText(message)) {
                return message;
            }
        } catch (Exception exception) {
            LOGGER.debug("Unable to parse Twilio error response", exception);
        }

        return "Unable to send OTP via SMS right now";
    }
}
