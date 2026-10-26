
package com.hospital.resource.hospital_resource_system.controller;
import com.hospital.resource.hospital_resource_system.dto.HospitalOccupancyDTO;
import com.hospital.resource.hospital_resource_system.entity.Hospital;
import com.hospital.resource.hospital_resource_system.service.HospitalService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hospitals")
public class HospitalController {

    private final HospitalService hospitalService;

    public HospitalController(HospitalService hospitalService) {
        this.hospitalService = hospitalService;
    }

    @GetMapping("/{id}/occupancy")
    public HospitalOccupancyDTO getHospitalOccupancy(
            @PathVariable Long id) {
        return hospitalService.getHospitalOccupancy(id);
    }

    // CREATE
    @PostMapping
    public Hospital createHospital(@RequestBody Hospital hospital) {
        return hospitalService.createHospital(hospital);
    }

    // READ ALL
    @GetMapping
    public List<Hospital> getAllHospitals() {
        return hospitalService.getAllHospitals();
    }

    // READ ONE
    @GetMapping("/{id}")
    public Hospital getHospitalById(@PathVariable Long id) {
        return hospitalService.getHospitalById(id);
    }

    // UPDATE
    @PutMapping("/{id}")
    public Hospital updateHospital(
            @PathVariable Long id,
            @RequestBody Hospital hospital) {
        return hospitalService.updateHospital(id, hospital);
    }

    // DELETE
    @DeleteMapping("/{id}")
    public String deleteHospital(@PathVariable Long id) {
        hospitalService.deleteHospital(id);
        return "Hospital deleted successfully";
    }
}
