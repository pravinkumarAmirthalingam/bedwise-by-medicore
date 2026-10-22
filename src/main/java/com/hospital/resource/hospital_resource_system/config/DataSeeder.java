
package com.hospital.resource.hospital_resource_system.config;

import com.hospital.resource.hospital_resource_system.entity.Role;
import com.hospital.resource.hospital_resource_system.entity.User;
import com.hospital.resource.hospital_resource_system.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner seedUsers(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {

        return args -> {
            createOrUpdateUser(
                    userRepository, passwordEncoder,
                    "superadmin", "superAdmin@123", Role.SUPER_ADMIN);

            createOrUpdateUser(
                    userRepository, passwordEncoder,
                    "hospitaladmin", "hospitalAdmin@123", Role.HOSPITAL_ADMIN);

            createOrUpdateUser(
                    userRepository, passwordEncoder,
                    "publicuser", "publicUser@123", Role.PUBLIC_USER);
        };
    }

    private void createOrUpdateUser(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            String username,
            String rawPassword,
            Role role) {

        User user = userRepository.findByUsername(username)
                .orElseGet(User::new);

        user.setUsername(username);
        user.setRole(role);

        String storedPassword = user.getPassword();

        // Hash existing plain-text passwords only once.
        if (storedPassword == null
                || !(storedPassword.startsWith("$2a$")
                || storedPassword.startsWith("$2b$")
                || storedPassword.startsWith("$2y$"))) {

            user.setPassword(passwordEncoder.encode(rawPassword));
        }

        userRepository.save(user);

        System.out.println("User initialized: " + username);
    }
}
