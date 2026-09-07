-- =============================================================================
-- Migration SQL : Table user_trips pour l'impact CO2 (UrbanFlow Mobility)
-- Exécution 100% idempotente (utilisable plusieurs fois sans risque d'erreur)
-- =============================================================================

-- 1. Activation de l'extension pour les identifiants UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Création de la table user_trips si elle n'existe pas
CREATE TABLE IF NOT EXISTS user_trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    transport_mode VARCHAR(50) NOT NULL,
    distance_km DECIMAL(10, 2) NOT NULL,
    co2_saved_kg DECIMAL(10, 3) NOT NULL,
    from_label VARCHAR(255) DEFAULT 'Départ',
    to_label VARCHAR(255) DEFAULT 'Arrivée',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Création des index d'optimisation (si non existants)
CREATE INDEX IF NOT EXISTS idx_user_trips_user_id ON user_trips(user_id);
CREATE INDEX IF NOT EXISTS idx_user_trips_created_at ON user_trips(created_at DESC);
