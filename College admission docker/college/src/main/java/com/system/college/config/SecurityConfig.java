package com.system.college.config;

import com.system.college.entity.Officer;
import com.system.college.entity.Student;
import com.system.college.repository.OfficerRepository;
import com.system.college.repository.StudentRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    private final StudentRepository studentRepo;
    private final OfficerRepository officerRepo;

    public SecurityConfig(StudentRepository studentRepo,
                          OfficerRepository officerRepo) {
        this.studentRepo = studentRepo;
        this.officerRepo = officerRepo;
    }

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    @Order(1)
    public SecurityFilterChain authChain(HttpSecurity http) throws Exception {
        http
                .securityMatcher("/auth/**")
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
                .httpBasic(AbstractHttpConfigurer::disable);

        return http.build();
    }

    @Bean
    @Order(2)
    public SecurityFilterChain studentChain(HttpSecurity http) throws Exception {
        http
                .securityMatcher("/students/**")
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .authenticationProvider(studentAuthProvider())
                .authorizeHttpRequests(auth -> auth.anyRequest().hasAuthority("STUDENT"))
                .httpBasic(Customizer.withDefaults());

        return http.build();
    }

    @Bean
    @Order(3)
    public SecurityFilterChain officerChain(HttpSecurity http) throws Exception {
        http
                .securityMatcher("/officers/**")
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .authenticationProvider(officerAuthProvider())
                .authorizeHttpRequests(auth -> auth.anyRequest().hasAuthority("OFFICER"))
                .httpBasic(Customizer.withDefaults());

        return http.build();
    }

    @Bean
    @Order(4)
    public SecurityFilterChain apiChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .authenticationProvider(multiRoleAuthProvider())
                .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
                .httpBasic(Customizer.withDefaults());

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
                "http://localhost:3000",
                "http://127.0.0.1:3000"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public AuthenticationProvider studentAuthProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(studentDetailsService());
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationProvider officerAuthProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(officerDetailsService());
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationProvider multiRoleAuthProvider() {
        return new MultiRoleAuthenticationProvider(studentRepo, officerRepo, passwordEncoder());
    }

    private UserDetailsService studentDetailsService() {
        return email -> {
            Student student = studentRepo.findByEmail(email)
                    .orElseThrow(() -> new UsernameNotFoundException("Student not found"));
            return User.builder()
                    .username(student.getEmail())
                    .password(student.getPassword())
                    .authorities(student.getRole())
                    .build();
        };
    }

    private UserDetailsService officerDetailsService() {
        return email -> {
            Officer officer = officerRepo.findByEmail(email)
                    .orElseThrow(() -> new UsernameNotFoundException("Officer not found"));
            return User.builder()
                    .username(officer.getEmail())
                    .password(officer.getPassword())
                    .authorities(officer.getRole())
                    .build();
        };
    }
}
