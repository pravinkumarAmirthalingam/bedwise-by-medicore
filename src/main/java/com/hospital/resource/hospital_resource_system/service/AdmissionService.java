
package com.hospital.resource.hospital_resource_system.service;

import com.hospital.resource.hospital_resource_system.entity.Admission;
import com.hospital.resource.hospital_resource_system.entity.Bed;
import com.hospital.resource.hospital_resource_system.entity.Patient;
import com.hospital.resource.hospital_resource_system.entity.Role;
import com.hospital.resource.hospital_resource_system.entity.User;

import com.hospital.resource.hospital_resource_system.repository.AdmissionRepository;
import com.hospital.resource.hospital_resource_system.repository.BedRepository;
import com.hospital.resource.hospital_resource_system.repository.PatientRepository;
import com.hospital.resource.hospital_resource_system.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AdmissionService {

    private final AdmissionRepository admissionRepository;
    private final PatientRepository patientRepository;
    private final BedRepository bedRepository;
    private final UserRepository userRepository;

    public AdmissionService(
            AdmissionRepository admissionRepository,
            PatientRepository patientRepository,
            BedRepository bedRepository,
            UserRepository userRepository) {

        this.admissionRepository = admissionRepository;
        this.patientRepository = patientRepository;
        this.bedRepository = bedRepository;
        this.userRepository = userRepository;
    }

    // Get all admissions permitted for the current user
    public List<Admission> getAllAdmissions() {

        User user = getCurrentUser();

        if (user.getRole() == Role.SUPER_ADMIN) {
            return admissionRepository.findAll();
        }

        Long hospitalId = getHospitalId(user);

        return admissionRepository.findAll()
                .stream()
                .filter(admission ->
                        admission.getBed().getHospital().getId()
                                .equals(hospitalId))
                .toList();
    }

    // Get one admission, checking hospital ownership
    public Admission getAdmissionById(Long id) {

        Admission admission = findAdmission(id);

        checkHospitalAccess(admission);

        return admission;
    }

    // Create an admission only for an authorized hospital
    @Transactional
    public Admission createAdmission(Long patientId, Long bedId) {

        User user = getCurrentUser();

        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Patient not found with id: " + patientId));

        Bed bed = bedRepository.findById(bedId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Bed not found with id: " + bedId));

        // Hospital Admin can use only beds belonging to their hospital.
        if (user.getRole() != Role.SUPER_ADMIN) {

            Long hospitalId = getHospitalId(user);

            if (!hospitalId.equals(bed.getHospital().getId())) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "You cannot admit patients to another hospital's bed");
            }
        }

        if (!"AVAILABLE".equalsIgnoreCase(bed.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Bed is not available");
        }

        bed.setStatus("OCCUPIED");
        bedRepository.save(bed);

        Admission admission = new Admission();
        admission.setPatient(patient);
        admission.setBed(bed);
        admission.setStatus("ACTIVE");
        admission.setAdmissionDate(LocalDateTime.now());

        return admissionRepository.save(admission);
    }

    // Discharge only an admission the current user is allowed to manage
    @Transactional
    public Admission dischargeAdmission(Long id) {

        Admission admission = findAdmission(id);

        checkHospitalAccess(admission);

        if (!"ACTIVE".equalsIgnoreCase(admission.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Admission is not active");
        }

        Bed bed = admission.getBed();

        bed.setStatus("AVAILABLE");
        admission.setStatus("DISCHARGED");

        return admissionRepository.save(admission);
    }

    // Find an admission or return 404
    private Admission findAdmission(Long id) {

        return admissionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Admission not found with id: " + id));
    }

    // Get the currently authenticated database user
    private User getCurrentUser() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication.getName() == null
                || authentication.getName().equals("anonymousUser")) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authentication required");
        }

        return userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Authenticated user not found"));
    }

    // Get the hospital assigned to a user
    private Long getHospitalId(User user) {

        if (user.getHospital() == null
                || user.getHospital().getId() == null) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "No hospital is assigned to this user");
        }

        return user.getHospital().getId();
    }

    // Check whether a user may access an admission
    private void checkHospitalAccess(Admission admission) {

        User user = getCurrentUser();

        if (user.getRole() == Role.SUPER_ADMIN) {
            return;
        }

        Long hospitalId = getHospitalId(user);
        Long admissionHospitalId =
                admission.getBed().getHospital().getId();

        if (!hospitalId.equals(admissionHospitalId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You cannot access admissions from another hospital");
        }
    }
}
