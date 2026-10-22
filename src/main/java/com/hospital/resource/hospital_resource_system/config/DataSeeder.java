package com.hospital.resource.hospital_resource_system.config;

import com.hospital.resource.hospital_resource_system.entity.Hospital;
import com.hospital.resource.hospital_resource_system.entity.Role;
import com.hospital.resource.hospital_resource_system.entity.User;
import com.hospital.resource.hospital_resource_system.repository.HospitalRepository;
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
            HospitalRepository hospitalRepository,
            PasswordEncoder passwordEncoder) {

        return args -> {
            Hospital defaultHospital = hospitalRepository.findAll().stream().findFirst().orElseGet(() -> {
                Hospital h = new Hospital();
                h.setName("City General Hospital");
                h.setLocation("Main Campus, Wing A");
                h.setPhone("+91-80-2630-4050");
                return hospitalRepository.save(h);
            });

            createOrUpdateUser(
                    userRepository, passwordEncoder,
                    "superadmin", "superAdmin@123", Role.SUPER_ADMIN, null);

            createOrUpdateUser(
                    userRepository, passwordEncoder,
                    "hospitaladmin", "hospitalAdmin@123", Role.HOSPITAL_ADMIN, defaultHospital);

            createOrUpdateUser(
                    userRepository, passwordEncoder,
                    "publicuser", "publicUser@123", Role.PUBLIC_USER, null);
        };
    }

    private void createOrUpdateUser(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            String username,
            String rawPassword,
            Role role,
            Hospital hospital) {

        User user = userRepository.findByUsername(username)
                .orElseGet(User::new);

        user.setUsername(username);
        user.setRole(role);

        if (hospital != null && user.getHospital() == null) {
            user.setHospital(hospital);
        }

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