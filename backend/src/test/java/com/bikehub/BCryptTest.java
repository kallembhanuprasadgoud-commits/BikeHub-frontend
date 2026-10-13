package com.bikehub;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertTrue;

class BCryptTest {
    @Test
    void testBCrypt() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String hash = encoder.encode("password123");
        System.out.println("BCRYPT_HASH_OUTPUT=" + hash);
        assertTrue(encoder.matches("password123", hash));
    }
}
