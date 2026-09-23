package com.busbooking.bus_booking_system.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Activer un broker simple en mémoire pour diffuser vers les clients
        config.enableSimpleBroker("/topic");
        // Préfixe pour les messages envoyés depuis le front vers le back
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Point d'entrée de connexion WebSocket (avec fallback SockJS si le protocole natif échoue)
        registry.addEndpoint("/ws-transit")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
}
