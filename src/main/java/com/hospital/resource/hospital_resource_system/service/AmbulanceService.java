package com.hospital.resource.hospital_resource_system.service;

import com.hospital.resource.hospital_resource_system.entity.Ambulance;
import com.hospital.resource.hospital_resource_system.entity.Patient;
import com.hospital.resource.hospital_resource_system.repository.AmbulanceRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@Service
public class AmbulanceService {
    private final AmbulanceRepository ambulanceRepository;

    public AmbulanceService(AmbulanceRepository ambulanceRepository) {
        this.ambulanceRepository = ambulanceRepository;
    }

    public Ambulance addAmbulance(Ambulance ambulance) {
        ambulance.setId(null);
        return ambulanceRepository.save(ambulance);
    }

    public List<Ambulance> getAllAmbulance(){
        return ambulanceRepository.findAll();
    }

    public Ambulance getAmbulanceById(Long id) {
        return ambulanceRepository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Hospital not found with ID: " + id
                        ));
    }


    public Ambulance updateAmbulance(Long id, Ambulance ambulance) {
        Ambulance existingAmbulance = getAmbulanceById(id);

        existingAmbulance.setVehicleNumber(ambulance.getVehicleNumber());
        existingAmbulance.setLocation(ambulance.getLocation());

        return ambulanceRepository.save(existingAmbulance);
    }

   public void deleteAmbulance(Long id){
        Ambulance ambulance = getAmbulanceById(id);
        ambulanceRepository.delete(ambulance);
   }

}
