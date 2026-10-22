package com.hospital.resource.hospital_resource_system.controller;

import com.hospital.resource.hospital_resource_system.entity.Hospital;
import com.hospital.resource.hospital_resource_system.entity.Patient;
import com.hospital.resource.hospital_resource_system.service.PatientService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/patient")
public class PatientController {
    private  PatientService patientService;

    public PatientController(PatientService patientService) {
        this.patientService = patientService;
    }

    @PostMapping
    public Patient addPatient(@RequestBody Patient patient){
       return patientService.addPatient(patient);
    }


    @PutMapping("/{id}")
    public Patient updatePatient(
            @PathVariable Long id,
            @RequestBody Patient patient) {
        return patientService.updatePatient(id, patient);
    }

    @GetMapping
    public List<Patient> getAllPatients(){
        return patientService.getAllpatient();
    }

    @DeleteMapping("/{id}")
    public String deletePatient(@PathVariable Long id){
          patientService.deletePatient(id);
          return "Patient deleted successfully";
    }
}
