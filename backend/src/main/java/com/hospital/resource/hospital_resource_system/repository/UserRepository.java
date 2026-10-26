package com.hospital.resource.hospital_resource_system.repository;

import com.hospital.resource.hospital_resource_system.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User,Long> {
    Optional<User> findByUsername(String username);
}
