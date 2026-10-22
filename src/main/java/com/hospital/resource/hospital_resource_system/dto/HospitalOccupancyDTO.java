package com.hospital.resource.hospital_resource_system.dto;

public class HospitalOccupancyDTO {

    private Long hospitalId;
    private String hospitalName;
    private long totalBeds;
    private long occupiedBeds;
    private long availableBeds;
    private double occupancyRate;

    public HospitalOccupancyDTO(
            Long hospitalId,
            String hospitalName,
            long totalBeds,
            long occupiedBeds,
            long availableBeds,
            double occupancyRate) {

        this.hospitalId = hospitalId;
        this.hospitalName = hospitalName;
        this.totalBeds = totalBeds;
        this.occupiedBeds = occupiedBeds;
        this.availableBeds = availableBeds;
        this.occupancyRate = occupancyRate;
    }

    public Long getHospitalId() {
        return hospitalId;
    }

    public String getHospitalName() {
        return hospitalName;
    }

    public long getTotalBeds() {
        return totalBeds;
    }

    public long getOccupiedBeds() {
        return occupiedBeds;
    }

    public long getAvailableBeds() {
        return availableBeds;
    }

    public double getOccupancyRate() {
        return occupancyRate;
    }
}