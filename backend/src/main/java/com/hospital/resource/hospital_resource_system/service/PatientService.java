package com.hospital.resource.hospital_resource_system.service;
import com.hospital.resource.hospital_resource_system.entity.Hospital;
import com.hospital.resource.hospital_resource_system.entity.Patient;
import com.hospital.resource.hospital_resource_system.repository.PatientRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class PatientService {
    private PatientRepository patientRepository;

    public PatientService(PatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }

    public Patient addPatient(Patient patient){
        patient.setId(null);
       return patientRepository.save(patient);
    }

    public List<Patient> getAllpatient(){
        return patientRepository.findAll();
    }

    public Patient getPatientById(Long id) {
        return patientRepository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Hospital not found with ID: " + id
                        ));
    }

    public Patient updatePatient(Long id, Patient Patient){
        Patient existingPatient = getPatientById(id);
        existingPatient.setName(Patient.getName());
        existingPatient.setAge(Patient.getAge());
        existingPatient.setGender(Patient.getGender());
        existingPatient.setCondition(Patient.getCondition());
        return patientRepository.save(existingPatient);
    }

    public void deletePatient(Long id){
        Patient patient = getPatientById(id);
         patientRepository.delete(patient);
    }

}
