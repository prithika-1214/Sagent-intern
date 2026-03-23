package com.app.seatbooking.domain;

public final class BookingDomainRules {

    public static final String EVENT_CATEGORY_MOVIE = "MOVIE";
    public static final String EVENT_CATEGORY_CONCERT = "CONCERT";
    public static final String EVENT_CATEGORY_STANDUP_SHOW = "STANDUP_SHOW";

    public static final String VENUE_TYPE_MOVIE_VENUE = "MOVIE_VENUE";
    public static final String VENUE_TYPE_CONCERT_VENUE = "CONCERT_VENUE";
    public static final String VENUE_TYPE_HALL_VENUE = "HALL_VENUE";

    public static final String DEFAULT_AUDI_ID = "AUDI_1";
    public static final String DEFAULT_AUDI_NAME = "Audi 1";
    public static final String CONCERT_CATEGORY_SEAT_TYPE = "CONCERT_CATEGORY";

    private BookingDomainRules() {
    }

    public static String normalizeEventCategory(String value) {
        String normalized = normalizeToken(value);
        if (normalized.isBlank()) {
            return EVENT_CATEGORY_MOVIE;
        }
        if ("SHOW".equals(normalized) || "STANDUP".equals(normalized) || "STANDUPSHOW".equals(normalized)) {
            return EVENT_CATEGORY_STANDUP_SHOW;
        }
        if ("MOVIE".equals(normalized)) {
            return EVENT_CATEGORY_MOVIE;
        }
        if ("CONCERT".equals(normalized)) {
            return EVENT_CATEGORY_CONCERT;
        }
        if (EVENT_CATEGORY_STANDUP_SHOW.equals(normalized)) {
            return EVENT_CATEGORY_STANDUP_SHOW;
        }
        return normalized;
    }

    public static String normalizeVenueType(String value) {
        String normalized = normalizeToken(value);
        if (normalized.isBlank()) {
            return VENUE_TYPE_MOVIE_VENUE;
        }
        if ("THEATER".equals(normalized)
                || "THEATRE".equals(normalized)
                || "CINEMA".equals(normalized)
                || VENUE_TYPE_MOVIE_VENUE.equals(normalized)) {
            return VENUE_TYPE_MOVIE_VENUE;
        }
        if ("GROUND".equals(normalized)
                || "OPEN_AIR_GROUND".equals(normalized)
                || "OPEN_GROUND".equals(normalized)
                || "STADIUM_GROUND".equals(normalized)
                || VENUE_TYPE_CONCERT_VENUE.equals(normalized)) {
            return VENUE_TYPE_CONCERT_VENUE;
        }
        if ("HALL".equals(normalized)
                || "AUDITORIUM".equals(normalized)
                || "AUDITORIUM_HALL".equals(normalized)
                || "COMEDY_CLUB_HALL".equals(normalized)
                || VENUE_TYPE_HALL_VENUE.equals(normalized)) {
            return VENUE_TYPE_HALL_VENUE;
        }
        return normalized;
    }

    public static String normalizeSeatType(String value, String venueType) {
        if (VENUE_TYPE_CONCERT_VENUE.equals(normalizeVenueType(venueType))) {
            return CONCERT_CATEGORY_SEAT_TYPE;
        }

        String normalized = normalizeToken(value);
        if (normalized.isBlank()) {
            return VENUE_TYPE_HALL_VENUE.equals(normalizeVenueType(venueType)) ? "GENERAL" : "REGULAR";
        }
        if ("EARLYBIRD".equals(normalized)) {
            return "EARLY_BIRD";
        }
        return normalized;
    }

    public static String normalizeConcertCategoryName(String value) {
        return text(value).toUpperCase();
    }

    public static String normalizeAudiId(String value, String fallbackName) {
        String source = text(value);
        if (source.isBlank()) {
            source = text(fallbackName);
        }
        if (source.isBlank()) {
            return DEFAULT_AUDI_ID;
        }

        String normalized = source.toUpperCase().replaceAll("[^A-Z0-9]+", "_");
        normalized = normalized.replaceAll("_+", "_").replaceAll("^_", "").replaceAll("_$", "");
        return normalized.isBlank() ? DEFAULT_AUDI_ID : normalized;
    }

    public static String normalizeAudiName(String value, String audiId) {
        String name = text(value);
        if (!name.isBlank()) {
            return name;
        }
        if (text(audiId).isBlank()) {
            return DEFAULT_AUDI_NAME;
        }
        return text(audiId).replace('_', ' ');
    }

    public static String requiredVenueTypeForEvent(String eventCategory) {
        String normalizedEventCategory = normalizeEventCategory(eventCategory);
        if (EVENT_CATEGORY_CONCERT.equals(normalizedEventCategory)) {
            return VENUE_TYPE_CONCERT_VENUE;
        }
        if (EVENT_CATEGORY_STANDUP_SHOW.equals(normalizedEventCategory)) {
            return VENUE_TYPE_HALL_VENUE;
        }
        return VENUE_TYPE_MOVIE_VENUE;
    }

    public static boolean isVenueCompatible(String eventCategory, String venueType) {
        return requiredVenueTypeForEvent(eventCategory).equals(normalizeVenueType(venueType));
    }

    public static boolean isConcertEvent(String eventCategory) {
        return EVENT_CATEGORY_CONCERT.equals(normalizeEventCategory(eventCategory));
    }

    public static boolean isSeatBasedEvent(String eventCategory) {
        String normalizedEventCategory = normalizeEventCategory(eventCategory);
        return EVENT_CATEGORY_MOVIE.equals(normalizedEventCategory)
                || EVENT_CATEGORY_STANDUP_SHOW.equals(normalizedEventCategory);
    }

    public static boolean requiresAudi(String eventCategory) {
        return isSeatBasedEvent(eventCategory);
    }

    public static boolean supportsPhysicalSeats(String venueType) {
        String normalizedVenueType = normalizeVenueType(venueType);
        return VENUE_TYPE_MOVIE_VENUE.equals(normalizedVenueType)
                || VENUE_TYPE_HALL_VENUE.equals(normalizedVenueType);
    }

    public static boolean supportsConcertCategories(String venueType) {
        return VENUE_TYPE_CONCERT_VENUE.equals(normalizeVenueType(venueType));
    }

    public static String text(String value) {
        return value == null ? "" : value.trim();
    }

    private static String normalizeToken(String value) {
        return text(value).toUpperCase().replace('-', '_').replace(' ', '_');
    }
}
