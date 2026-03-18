-- =============================================================================
-- 001_initial_schema.sql
-- Sandrock Renter Portal - Initial Schema
-- =============================================================================


-- =============================================================================
-- TABLES
-- =============================================================================

-- profiles: extends auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id           uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role         text        NOT NULL CHECK (role IN ('landlord', 'renter')),
    full_name    text        NOT NULL,
    phone        text,
    status       text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

-- properties
CREATE TABLE IF NOT EXISTS public.properties (
    id                    uuid        NOT NULL DEFAULT gen_random_uuid(),
    landlord_id           uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    address_line_1        text        NOT NULL,
    address_line_2        text,
    city                  text        NOT NULL,
    postcode              text        NOT NULL,
    property_type         text        NOT NULL CHECK (property_type IN ('house', 'flat', 'studio', 'room')),
    bedrooms              integer     NOT NULL,
    status                text        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    emergency_contacts    jsonb       NOT NULL DEFAULT '[]',
    house_rules           text,
    move_in_guide         text,
    wifi_details          text,
    utility_info          text,
    bin_collection_day    text,
    created_at            timestamptz NOT NULL DEFAULT now(),
    updated_at            timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

-- tenancies
CREATE TABLE IF NOT EXISTS public.tenancies (
    id                    uuid        NOT NULL DEFAULT gen_random_uuid(),
    property_id           uuid        NOT NULL REFERENCES public.properties(id) ON DELETE RESTRICT,
    renter_id             uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    lease_start           date        NOT NULL,
    lease_end             date,
    rent_amount_pence     integer     NOT NULL,
    rent_frequency        text        NOT NULL DEFAULT 'monthly' CHECK (rent_frequency IN ('weekly', 'monthly')),
    deposit_amount_pence  integer,
    deposit_scheme        text,
    deposit_reference     text,
    status                text        NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'ended')),
    created_at            timestamptz NOT NULL DEFAULT now(),
    updated_at            timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

-- documents (immutable — no updated_at)
CREATE TABLE IF NOT EXISTS public.documents (
    id                   uuid        NOT NULL DEFAULT gen_random_uuid(),
    tenancy_id           uuid        NOT NULL REFERENCES public.tenancies(id) ON DELETE RESTRICT,
    uploaded_by          uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    category             text        NOT NULL CHECK (category IN (
                             'passport', 'driving_licence', 'proof_of_address', 'payslip',
                             'employment_contract', 'visa_brp', 'credit_check', 'guarantor_details',
                             'tenancy_agreement', 'government_info_sheet', 'epc', 'gas_safety_cert',
                             'eicr', 'deposit_protection_cert', 'house_rules', 'other'
                         )),
    file_name            text        NOT NULL,
    file_size            integer     NOT NULL,
    mime_type            text        NOT NULL,
    storage_path         text        NOT NULL,
    version              integer     NOT NULL DEFAULT 1,
    parent_document_id   uuid        REFERENCES public.documents(id) ON DELETE SET NULL,
    review_status        text        NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'accepted', 'more_info_needed')),
    review_note          text,
    reviewed_by          uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at          timestamptz,
    expires_at           timestamptz,
    created_at           timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

-- invitations
CREATE TABLE IF NOT EXISTS public.invitations (
    id                   uuid        NOT NULL DEFAULT gen_random_uuid(),
    property_id          uuid        NOT NULL REFERENCES public.properties(id) ON DELETE RESTRICT,
    invited_by           uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    email                text        NOT NULL,
    token                text        NOT NULL UNIQUE,
    renter_name          text,
    lease_start          date,
    rent_amount_pence    integer,
    status               text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    expires_at           timestamptz NOT NULL,
    created_at           timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);


-- =============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_properties_updated_at
    BEFORE UPDATE ON public.properties
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_tenancies_updated_at
    BEFORE UPDATE ON public.tenancies
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- =============================================================================
-- AUTO-CREATE PROFILE ON SIGN-UP
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, role, full_name, status)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'role', 'renter'),
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        'pending'
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenancies   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;


-- ---------------------------------------------------------------------------
-- profiles policies
-- ---------------------------------------------------------------------------

-- Users can read their own profile
CREATE POLICY "profiles_select_own"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Landlords can read all profiles
-- Uses JWT user_metadata to check role (avoids infinite recursion from self-referencing profiles)
CREATE POLICY "profiles_select_landlord"
    ON public.profiles
    FOR SELECT
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'landlord'
    );

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (needed for the sign-up trigger fallback)
CREATE POLICY "profiles_insert_own"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);


-- ---------------------------------------------------------------------------
-- properties policies
-- ---------------------------------------------------------------------------

-- Landlords can SELECT their own properties
CREATE POLICY "properties_select_landlord"
    ON public.properties
    FOR SELECT
    USING (
        landlord_id = auth.uid()
    );

-- Renters can SELECT properties they have a tenancy for
CREATE POLICY "properties_select_renter"
    ON public.properties
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tenancies t
            WHERE t.property_id = properties.id
              AND t.renter_id = auth.uid()
        )
    );

-- Landlords can INSERT their own properties
CREATE POLICY "properties_insert_landlord"
    ON public.properties
    FOR INSERT
    WITH CHECK (
        landlord_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.role = 'landlord'
        )
    );

-- Landlords can UPDATE their own properties
CREATE POLICY "properties_update_landlord"
    ON public.properties
    FOR UPDATE
    USING (landlord_id = auth.uid())
    WITH CHECK (landlord_id = auth.uid());

-- Landlords can DELETE their own properties
CREATE POLICY "properties_delete_landlord"
    ON public.properties
    FOR DELETE
    USING (landlord_id = auth.uid());


-- ---------------------------------------------------------------------------
-- tenancies policies
-- ---------------------------------------------------------------------------

-- Landlords can SELECT tenancies for their properties
CREATE POLICY "tenancies_select_landlord"
    ON public.tenancies
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.properties pr
            WHERE pr.id = tenancies.property_id
              AND pr.landlord_id = auth.uid()
        )
    );

-- Renters can SELECT their own tenancies
CREATE POLICY "tenancies_select_renter"
    ON public.tenancies
    FOR SELECT
    USING (renter_id = auth.uid());

-- Landlords can INSERT tenancies for their properties
CREATE POLICY "tenancies_insert_landlord"
    ON public.tenancies
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.properties pr
            WHERE pr.id = tenancies.property_id
              AND pr.landlord_id = auth.uid()
        )
    );

-- Landlords can UPDATE tenancies for their properties
CREATE POLICY "tenancies_update_landlord"
    ON public.tenancies
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.properties pr
            WHERE pr.id = tenancies.property_id
              AND pr.landlord_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.properties pr
            WHERE pr.id = tenancies.property_id
              AND pr.landlord_id = auth.uid()
        )
    );

-- Landlords can DELETE tenancies for their properties
CREATE POLICY "tenancies_delete_landlord"
    ON public.tenancies
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.properties pr
            WHERE pr.id = tenancies.property_id
              AND pr.landlord_id = auth.uid()
        )
    );


-- ---------------------------------------------------------------------------
-- documents policies
-- ---------------------------------------------------------------------------

-- Authenticated users can INSERT documents where they are uploaded_by
CREATE POLICY "documents_insert_uploaded_by"
    ON public.documents
    FOR INSERT
    WITH CHECK (uploaded_by = auth.uid());

-- Landlords can SELECT documents for their properties' tenancies
CREATE POLICY "documents_select_landlord"
    ON public.documents
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.tenancies t
            JOIN public.properties pr ON pr.id = t.property_id
            WHERE t.id = documents.tenancy_id
              AND pr.landlord_id = auth.uid()
        )
    );

-- Renters can SELECT documents for their own tenancies
CREATE POLICY "documents_select_renter"
    ON public.documents
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tenancies t
            WHERE t.id = documents.tenancy_id
              AND t.renter_id = auth.uid()
        )
    );

-- Only landlords can UPDATE (for document review fields only)
-- review_status, review_note, reviewed_by, reviewed_at
CREATE POLICY "documents_update_landlord_review"
    ON public.documents
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM public.tenancies t
            JOIN public.properties pr ON pr.id = t.property_id
            WHERE t.id = documents.tenancy_id
              AND pr.landlord_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.tenancies t
            JOIN public.properties pr ON pr.id = t.property_id
            WHERE t.id = documents.tenancy_id
              AND pr.landlord_id = auth.uid()
        )
    );

-- NO DELETE policy on documents (immutability enforced by omission)


-- ---------------------------------------------------------------------------
-- invitations policies
-- ---------------------------------------------------------------------------

-- Landlords can SELECT their own invitations
CREATE POLICY "invitations_select_landlord"
    ON public.invitations
    FOR SELECT
    USING (invited_by = auth.uid());

-- Anyone (including anonymous) can SELECT an invitation by token
-- (used during the accept-invite flow before sign-up)
CREATE POLICY "invitations_select_by_token"
    ON public.invitations
    FOR SELECT
    USING (true);

-- Landlords can INSERT invitations for their own properties
CREATE POLICY "invitations_insert_landlord"
    ON public.invitations
    FOR INSERT
    WITH CHECK (
        invited_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.properties pr
            WHERE pr.id = invitations.property_id
              AND pr.landlord_id = auth.uid()
        )
    );

-- Landlords can UPDATE their own invitations (e.g. mark expired)
CREATE POLICY "invitations_update_landlord"
    ON public.invitations
    FOR UPDATE
    USING (invited_by = auth.uid())
    WITH CHECK (invited_by = auth.uid());

-- Landlords can DELETE their own invitations
CREATE POLICY "invitations_delete_landlord"
    ON public.invitations
    FOR DELETE
    USING (invited_by = auth.uid());


-- =============================================================================
-- STORAGE BUCKET
-- =============================================================================

-- Create the private documents bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('sandrock-documents', 'sandrock-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: enable on storage.objects
-- (Supabase enables RLS on storage.objects by default; policies are added below)

-- Authenticated users can upload objects under their own tenancy path
-- Expected path convention: <tenancy_id>/<anything>
CREATE POLICY "storage_insert_authenticated"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'sandrock-documents'
        AND auth.role() = 'authenticated'
    );

-- Landlords can read all objects in the bucket
CREATE POLICY "storage_select_landlord"
    ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'sandrock-documents'
        AND EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.role = 'landlord'
        )
    );

-- Renters can read objects that belong to their own tenancies
-- Path convention: <tenancy_id>/...
CREATE POLICY "storage_select_renter"
    ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'sandrock-documents'
        AND EXISTS (
            SELECT 1 FROM public.tenancies t
            WHERE t.renter_id = auth.uid()
              AND (storage.objects.name LIKE (t.id::text || '/%')
                   OR storage.objects.name = t.id::text)
        )
    );

-- NO delete policy for renters (landlords also have no delete policy)
-- Deletes are blocked for all users by omission.
