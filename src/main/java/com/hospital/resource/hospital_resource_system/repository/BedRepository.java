package com.hospital.resource.hospital_resource_system.repository;

import com.hospital.resource.hospital_resource_system.entity.Bed;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BedRepository extends JpaRepository<Bed, Long> {

    List<Bed> findByHospital_Id(Long hospitalId);

    List<Bed> findByStatusIgnoreCase(String status);

    List<Bed> findByStatusIgnoreCaseAndTypeIgnoreCase(
            String status, String type);

    long countByHospital_Id(Long hospitalId);

    long countByHospital_IdAndStatusIgnoreCase(
            Long hospitalId,
            String status
    );

}
