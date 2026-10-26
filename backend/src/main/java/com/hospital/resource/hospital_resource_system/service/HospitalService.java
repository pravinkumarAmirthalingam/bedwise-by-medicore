package com.hospital.resource.hospital_resource_system.service;

import com.hospital.resource.hospital_resource_system.entity.Hospital;
import com.hospital.resource.hospital_resource_system.dto.HospitalOccupancyDTO;
import com.hospital.resource.hospital_resource_system.repository.HospitalRepository;
import com.hospital.resource.hospital_resource_system.repository.BedRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class HospitalService {

    private final HospitalRepository hospitalRepository;
    private final BedRepository bedRepository;

    // One constructor initializes both dependencies
    public HospitalService(
            HospitalRepository hospitalRepository,
            BedRepository bedRepository) {
        this.hospitalRepository = hospitalRepository;
        this.bedRepository = bedRepository;
    }

    // CREATE
    public Hospital createHospital(Hospital hospital) {
        hospital.setId(null);
        return hospitalRepository.save(hospital);
    }

    // READ ALL
    public List<Hospital> getAllHospitals() {
        return hospitalRepository.findAll();
    }

    // READ ONE
    public Hospital getHospitalById(Long id) {
        return hospitalRepository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Hospital not found with ID: " + id
                        ));
    }

    // UPDATE
    public Hospital updateHospital(Long id, Hospital updatedHospital) {
        Hospital existingHospital = getHospitalById(id);

        existingHospital.setName(updatedHospital.getName());
        existingHospital.setLocation(updatedHospital.getLocation());
        existingHospital.setPhone(updatedHospital.getPhone());

        return hospitalRepository.save(existingHospital);
    }

    // DELETE
    public void deleteHospital(Long id) {
        Hospital hospital = getHospitalById(id);
        hospitalRepository.delete(hospital);
    }

    // CALCULATE HOSPITAL OCCUPANCY
    public HospitalOccupancyDTO getHospitalOccupancy(Long hospitalId) {

        Hospital hospital = getHospitalById(hospitalId);

        long totalBeds =
                bedRepository.countByHospital_Id(hospitalId);

        long occupiedBeds =
                bedRepository.countByHospital_IdAndStatusIgnoreCase(
                        hospitalId, "OCCUPIED");

        long availableBeds = totalBeds - occupiedBeds;

        double occupancyRate = totalBeds == 0
                ? 0.0
                : (occupiedBeds * 100.0) / totalBeds;

        return new HospitalOccupancyDTO(
                hospital.getId(),
                hospital.getName(),
                totalBeds,
                occupiedBeds,
                availableBeds,
                Math.round(occupancyRate * 100.0) / 100.0
        );
    }
}
