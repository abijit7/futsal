package com.futsal.service;

import com.futsal.model.Futsal;
import com.futsal.repository.FutsalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FutsalService {

    @Autowired
    private FutsalRepository futsalRepository;

    public List<Futsal> getAll() {
        return futsalRepository.findAll();
    }

    public Futsal getById(Long id) {
        return futsalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Futsal not found with ID: " + id));
    }

    public Futsal add(Futsal futsal) {
        return futsalRepository.save(futsal);
    }

    public Futsal update(Long id, Futsal updated) {
        Futsal existing = getById(id);
        existing.setName(updated.getName());
        existing.setAddress(updated.getAddress());
        existing.setCity(updated.getCity());
        existing.setPhone(updated.getPhone());
        existing.setHourlyPrice(updated.getHourlyPrice());
        existing.setOpeningTime(updated.getOpeningTime());
        existing.setDescription(updated.getDescription());
        return futsalRepository.save(existing);
    }

    public void delete(Long id) {
        if (!futsalRepository.existsById(id)) {
            throw new RuntimeException("Futsal not found");
        }
        futsalRepository.deleteById(id);
    }
}
