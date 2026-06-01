package com.futsal.service;

import com.futsal.model.Futsal;
import com.futsal.model.FutsalImage;
import com.futsal.repository.FutsalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class FutsalService {

    @Autowired
    private FutsalRepository futsalRepository;

    public Page<Futsal> getAll(Pageable pageable) {
        return futsalRepository.findAll(pageable);
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
        List<String> resolved = new ArrayList<>();

        if (urls != null && !urls.isEmpty()) {
            resolved.addAll(urls);
        } else if (single != null && !single.isBlank()) {
            resolved.add(single);
        }

        target.getImages().clear();
        int order = 0;
        for (String url : resolved) {
            if (url == null || url.isBlank()) {
                continue;
            }
            boolean cover = order == 0;
            FutsalImage image = new FutsalImage(target, url.trim(), order, cover);
            target.getImages().add(image);
            order++;
        }

        if (!target.getImages().isEmpty()) {
            target.setImageUrl(target.getImages().get(0).getImageUrl());
        } else {
            target.setImageUrl(null);
        }
    }

    public void delete(Long id) {
        if (!futsalRepository.existsById(id)) {
            throw new RuntimeException("Futsal not found");
        }
        futsalRepository.deleteById(id);
    }
}
