package com.futsal.service;

import com.futsal.model.Futsal;
import com.futsal.repository.FutsalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
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
        syncImages(futsal, futsal);
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
        syncImages(existing, updated);
        existing.setDescription(updated.getDescription());
        return futsalRepository.save(existing);
    }

    private void syncImages(Futsal target, Futsal source) {
        List<String> urls = source.getImageUrls();
        String single = source.getImageUrl();

        if (urls != null && !urls.isEmpty()) {
            target.setImageUrls(new ArrayList<>(urls));
            target.setImageUrl(urls.get(0));
            return;
        }

        if (single != null && !single.isBlank()) {
            List<String> list = new ArrayList<>();
            list.add(single);
            target.setImageUrls(list);
            target.setImageUrl(single);
            return;
        }

        target.setImageUrls(new ArrayList<>());
        target.setImageUrl(null);
    }

    public void delete(Long id) {
        if (!futsalRepository.existsById(id)) {
            throw new RuntimeException("Futsal not found");
        }
        futsalRepository.deleteById(id);
    }
}
