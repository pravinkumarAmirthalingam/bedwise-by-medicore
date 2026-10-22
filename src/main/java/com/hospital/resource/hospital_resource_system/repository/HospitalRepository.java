
package com.hospital.resource.hospital_resource_system.repository;

import com.hospital.resource.hospital_resource_system.entity.Hospital;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HospitalRepository
        extends JpaRepository<Hospital, Long> {
}
