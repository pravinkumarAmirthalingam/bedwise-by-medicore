package com.hospital.resource.hospital_resource_system.repository;

import com.hospital.resource.hospital_resource_system.entity.Admission;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdmissionRepository extends JpaRepository<Admission,Long> {
}
