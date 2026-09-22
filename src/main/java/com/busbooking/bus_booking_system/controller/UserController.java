package com.busbooking.bus_booking_system.controller;

import com.busbooking.bus_booking_system.entity.User;
import com.busbooking.bus_booking_system.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/profile")
    public ResponseEntity<User> getUserProfile(Authentication authentication) {
        String email = authentication.getName();
        try {
            User user = userService.getUserProfile(email);
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            logger.error("Failed to fetch profile for user {}: {}", email, e.getMessage());
            return ResponseEntity.badRequest().body(null); // Return null body with 400 status
        } catch (Exception e) {
            logger.error("Internal server error while fetching profile for user {}: {}", email, e.getMessage());
            return ResponseEntity.status(500).body(null); // Return null body with 500 status
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<User> updateUserProfile(@RequestBody UserUpdateRequest updateRequest, Authentication authentication) {
        String email = authentication.getName();
        try {
            User user = userService.updateProfile(email, updateRequest);
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            logger.error("Failed to update profile for user {}: {}", email, e.getMessage());
            return ResponseEntity.badRequest().body(null); // Return null body with 400 status
        } catch (Exception e) {
            logger.error("Internal server error while updating profile for user {}: {}", email, e.getMessage());
            return ResponseEntity.status(500).body(null); // Return null body with 500 status
        }
    }
}