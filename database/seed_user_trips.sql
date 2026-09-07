-- =============================================================================
-- Script d'insertion SQL conditionnel et idempotent pour l'utilisateur de test
-- Inscription sécurisée de 4 trajets fictifs (Vélo, Métro, Tramway, Marche)
-- =============================================================================

DO $$
DECLARE
    test_user_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
BEGIN
    -- Trajet 1 : Vélo
    IF NOT EXISTS (SELECT 1 FROM user_trips WHERE user_id = test_user_id AND from_label = 'Châtillon - Montrouge' AND to_label = 'Porte d''Orléans') THEN
        INSERT INTO user_trips (id, user_id, transport_mode, distance_km, co2_saved_kg, from_label, to_label, created_at)
        VALUES (
            '11111111-1111-1111-1111-111111111111',
            test_user_id,
            'bike',
            4.20,
            0.880,
            'Châtillon - Montrouge',
            'Porte d''Orléans',
            CURRENT_TIMESTAMP - INTERVAL '2 hours'
        );
    END IF;

    -- Trajet 2 : Métro
    IF NOT EXISTS (SELECT 1 FROM user_trips WHERE user_id = test_user_id AND from_label = 'Gare Montparnasse' AND to_label = 'Châtelet') THEN
        INSERT INTO user_trips (id, user_id, transport_mode, distance_km, co2_saved_kg, from_label, to_label, created_at)
        VALUES (
            '22222222-2222-2222-2222-222222222222',
            test_user_id,
            'metro',
            3.80,
            0.650,
            'Gare Montparnasse',
            'Châtelet',
            CURRENT_TIMESTAMP - INTERVAL '1 day'
        );
    END IF;

    -- Trajet 3 : Tramway
    IF NOT EXISTS (SELECT 1 FROM user_trips WHERE user_id = test_user_id AND from_label = 'Viroflay Rive Droite' AND to_label = 'Châtillon') THEN
        INSERT INTO user_trips (id, user_id, transport_mode, distance_km, co2_saved_kg, from_label, to_label, created_at)
        VALUES (
            '33333333-3333-3333-3333-333333333333',
            test_user_id,
            'tram',
            6.50,
            1.250,
            'Viroflay Rive Droite',
            'Châtillon',
            CURRENT_TIMESTAMP - INTERVAL '2 days'
        );
    END IF;

    -- Trajet 4 : Marche à pied
    IF NOT EXISTS (SELECT 1 FROM user_trips WHERE user_id = test_user_id AND from_label = 'Bastille' AND to_label = 'Le Marais') THEN
        INSERT INTO user_trips (id, user_id, transport_mode, distance_km, co2_saved_kg, from_label, to_label, created_at)
        VALUES (
            '44444444-4444-4444-4444-444444444444',
            test_user_id,
            'walking',
            1.50,
            0.320,
            'Bastille',
            'Le Marais',
            CURRENT_TIMESTAMP - INTERVAL '3 days'
        );
    END IF;
END $$;
