package com.hospital.resource.hospital_resource_system.service;

import com.hospital.resource.hospital_resource_system.entity.Bed;
import com.hospital.resource.hospital_resource_system.entity.Role;
import com.hospital.resource.hospital_resource_system.entity.User;
import com.hospital.resource.hospital_resource_system.repository.BedRepository;
import com.hospital.resource.hospital_resource_system.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class BedService {

    private final BedRepository bedRepository;
    private final UserRepository userRepository;

    public BedService(
            BedRepository bedRepository,
            UserRepository userRepository) {
        this.bedRepository = bedRepository;
        this.userRepository = userRepository;
    }



    public List<Bed> getAvailableBeds() {
        User user = getCurrentUser();

        if (user.getRole() == Role.SUPER_ADMIN) {
            return bedRepository.findByStatusIgnoreCase("AVAILABLE");
        }

        Long hospitalId = getHospitalId(user);

        return bedRepository.findByHospital_Id(hospitalId)
                .stream()
                .filter(bed ->
                        "AVAILABLE".equalsIgnoreCase(bed.getStatus()))
                .toList();
    }


    public List<Bed> getAllBeds() {
        User user = getCurrentUser();

        if (user.getRole() == Role.SUPER_ADMIN) {
            return bedRepository.findAll();
        }

        Long hospitalId = getHospitalId(user);
        return bedRepository.findByHospital_Id(hospitalId);
    }

    public Bed getBedById(Long id) {
        Bed bed = bedRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Bed not found"));

        User user = getCurrentUser();

        if (user.getRole() == Role.SUPER_ADMIN) {
            return bed;
        }

        Long hospitalId = getHospitalId(user);

        if (!hospitalId.equals(bed.getHospital().getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You cannot access beds from another hospital");
        }

        return bed;
    }

    @Transactional
    public Bed createBed(Bed bed) {
        User user = getCurrentUser();

        if (user.getRole() == Role.SUPER_ADMIN) {
            return bedRepository.save(bed);
        }

        Long hospitalId = getHospitalId(user);

        if (bed.getHospital() == null
                || bed.getHospital().getId() == null
                || !hospitalId.equals(bed.getHospital().getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You can create beds only for your assigned hospital");
        }

        return bedRepository.save(bed);
    }

    @Transactional
    public void deleteBed(Long id) {
        Bed bed = getBedById(id);
        bedRepository.delete(bed);
    }

    private User getCurrentUser() {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getName() == null
                || authentication.getName().equals("anonymousUser")) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Authentication required");
        }

        return userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "User not found"));
    }


    public List<Bed> getAvailableBedsByType(String type) {

        User user = getCurrentUser();

        if (type == null || type.isBlank()) {
            return getAvailableBeds();
        }

        if (user.getRole() == Role.SUPER_ADMIN) {
            return bedRepository
                    .findByStatusIgnoreCaseAndTypeIgnoreCase(
                            "AVAILABLE", type);
        }

        Long hospitalId = getHospitalId(user);

        return bedRepository.findByHospital_Id(hospitalId)
                .stream()
                .filter(bed ->
                        "AVAILABLE".equalsIgnoreCase(bed.getStatus()))
                .filter(bed ->
                        type.equalsIgnoreCase(bed.getType()))
                .toList();
    }


    private Long getHospitalId(User user) {
        if (user.getHospital() == null || user.getHospital().getId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "No hospital is assigned to this user");
        }

        return user.getHospital().getId();
    }
}
