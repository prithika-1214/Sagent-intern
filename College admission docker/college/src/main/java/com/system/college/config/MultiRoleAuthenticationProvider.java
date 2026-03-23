package com.system.college.config;

import com.system.college.entity.Officer;
import com.system.college.entity.Student;
import com.system.college.repository.OfficerRepository;
import com.system.college.repository.StudentRepository;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
public class MultiRoleAuthenticationProvider implements AuthenticationProvider {

    private final StudentRepository studentRepo;
    private final OfficerRepository officerRepo;
    private final BCryptPasswordEncoder encoder;

    public MultiRoleAuthenticationProvider(StudentRepository studentRepo,
                                           OfficerRepository officerRepo,
                                           BCryptPasswordEncoder encoder) {
        this.studentRepo = studentRepo;
        this.officerRepo = officerRepo;
        this.encoder = encoder;
    }

    @Override
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {
        String email = authentication.getName();
        Object credentials = authentication.getCredentials();
        String rawPassword = credentials == null ? null : credentials.toString();

        Student student = studentRepo.findByEmail(email).orElse(null);
        if (student != null && matchesPassword(rawPassword, student.getPassword())) {
            return new UsernamePasswordAuthenticationToken(
                    student.getEmail(),
                    student.getPassword(),
                    AuthorityUtils.createAuthorityList(student.getRole())
            );
        }

        Officer officer = officerRepo.findByEmail(email).orElse(null);
        if (officer != null && matchesPassword(rawPassword, officer.getPassword())) {
            return new UsernamePasswordAuthenticationToken(
                    officer.getEmail(),
                    officer.getPassword(),
                    AuthorityUtils.createAuthorityList(officer.getRole())
            );
        }

        throw new BadCredentialsException("Invalid username or password");
    }

    @Override
    public boolean supports(Class<?> authentication) {
        return UsernamePasswordAuthenticationToken.class.isAssignableFrom(authentication);
    }

    private boolean isBcryptHash(String value) {
        if (value == null) {
            return false;
        }
        return value.startsWith("$2a$") || value.startsWith("$2b$") || value.startsWith("$2y$");
    }

    private boolean matchesPassword(String rawPassword, String storedPassword) {
        if (rawPassword == null || storedPassword == null || storedPassword.isBlank()) {
            return false;
        }
        if (isBcryptHash(storedPassword)) {
            return encoder.matches(rawPassword, storedPassword);
        }
        return rawPassword.equals(storedPassword);
    }
}
