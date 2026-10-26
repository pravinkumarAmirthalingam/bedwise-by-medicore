package com.hospital.resource.hospital_resource_system.repository;

import com.hospital.resource.hospital_resource_system.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PatientRepository extends JpaRepository<Patient, Long> {
}
