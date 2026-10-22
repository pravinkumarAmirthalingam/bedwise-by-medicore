package com.hospital.resource.hospital_resource_system.controller;

import com.hospital.resource.hospital_resource_system.entity.Ambulance;
import com.hospital.resource.hospital_resource_system.service.AmbulanceService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ambulance")
public class AmbulanceController {
    private AmbulanceService ambulanceService;

    public AmbulanceController(AmbulanceService ambulanceService) {
        this.ambulanceService = ambulanceService;
    }

    @PostMapping
    public Ambulance addAmbulance(@RequestBody Ambulance ambulance){
        return ambulanceService.addAmbulance(ambulance);
    }

    @GetMapping
    public List<Ambulance> getAllAmbulance(){
        return ambulanceService.getAllAmbulance();
    }

    @PutMapping("/{id}")
    public Ambulance updateAmbulance(@PathVariable Long id, @RequestBody Ambulance ambulance){
        return ambulanceService.updateAmbulance(id,ambulance);
    }


    @DeleteMapping("/{id}")
    public String deleteAmbulance(@PathVariable Long id) {
        ambulanceService.deleteAmbulance(id);
        return "Ambulance deleted successfully";
    }



}
