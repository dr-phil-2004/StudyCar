package com.busbooking.bus_booking_system.controller;

import com.busbooking.bus_booking_system.entity.User;
import com.busbooking.bus_booking_system.repository.UserRepository;
import com.busbooking.bus_booking_system.security.JwtUtil;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthController(AuthenticationManager authenticationManager, UserRepository userRepository,
                          PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        String name = request.name().trim();
        String email = request.email().trim().toLowerCase();

        if (userRepository.findByName(name).isPresent()) {
            return ResponseEntity.badRequest().body("Name already exists");
        }
        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body("Email already exists");
        }
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole("ROLE_USER");
        userRepository.save(user);
        return ResponseEntity.ok("User registered successfully");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            String email = loginRequest.email().trim().toLowerCase();
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, loginRequest.password()));
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String jwt = jwtUtil.generateToken(userDetails);
            return ResponseEntity.ok(new JwtResponse(jwt));
        } catch (BadCredentialsException exception) {
            return ResponseEntity.status(401).body("Invalid email or password");
        }
    }

    public record RegisterRequest(
            @NotBlank(message = "Name is required")
            @Size(max = 100, message = "Name is too long")
            String name,
            @NotBlank(message = "Email is required")
            @Email(message = "Email must be valid")
            String email,
            @NotBlank(message = "Password is required")
            @Size(min = 6, max = 100, message = "Password must contain 6 to 100 characters")
            String password) {
    }

    public record LoginRequest(
            @NotBlank(message = "Email is required")
            @Email(message = "Email must be valid")
            String email,
            @NotBlank(message = "Password is required")
            String password) {
    }

    public record JwtResponse(String token) {
    }

}
