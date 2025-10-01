DO $$
BEGIN
  IF to_regclass('public.material_requests') IS NOT NULL THEN
    -- Garantir RLS
    EXECUTE 'ALTER TABLE public.material_requests ENABLE ROW LEVEL SECURITY';

    -- Remover policies antigas se existirem
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='material_requests' AND policyname='material_requests_select_requester_or_managers') THEN
      EXECUTE 'DROP POLICY "material_requests_select_requester_or_managers" ON public.material_requests';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='material_requests' AND policyname='material_requests_insert_requester') THEN
      EXECUTE 'DROP POLICY "material_requests_insert_requester" ON public.material_requests';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='material_requests' AND policyname='material_requests_update_by_managers') THEN
      EXECUTE 'DROP POLICY "material_requests_update_by_managers" ON public.material_requests';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='material_requests' AND policyname='material_requests_delete_by_managers') THEN
      EXECUTE 'DROP POLICY "material_requests_delete_by_managers" ON public.material_requests';
    END IF;

    -- Recriar policies corretas
    EXECUTE 'CREATE POLICY "material_requests_select_requester_or_managers" ON public.material_requests
      FOR SELECT TO authenticated
      USING (
        requested_by_user_id = auth.uid()
        OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN (''Admin'',''Gestor de Material'',''Coordenador'')
      )';

    EXECUTE 'CREATE POLICY "material_requests_insert_requester" ON public.material_requests
      FOR INSERT TO authenticated
      WITH CHECK (requested_by_user_id = auth.uid())';

    EXECUTE 'CREATE POLICY "material_requests_update_by_managers" ON public.material_requests
      FOR UPDATE TO authenticated
      USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN (''Admin'',''Gestor de Material'',''Coordenador''))
      WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN (''Admin'',''Gestor de Material'',''Coordenador''))';

    EXECUTE 'CREATE POLICY "material_requests_delete_by_managers" ON public.material_requests
      FOR DELETE TO authenticated
      USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN (''Admin'',''Gestor de Material'',''Coordenador''))';
  END IF;
END
$$;

DO $$
BEGIN
  IF to_regclass('public.material_request_items') IS NOT NULL THEN
    -- Garantir RLS
    EXECUTE 'ALTER TABLE public.material_request_items ENABLE ROW LEVEL SECURITY';

    -- Remover policies antigas se existirem
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='material_request_items' AND policyname='material_request_items_select_also_if_parent_visible') THEN
      EXECUTE 'DROP POLICY "material_request_items_select_also_if_parent_visible" ON public.material_request_items';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='material_request_items' AND policyname='material_request_items_insert_if_request_belongs_to_user') THEN
      EXECUTE 'DROP POLICY "material_request_items_insert_if_request_belongs_to_user" ON public.material_request_items';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='material_request_items' AND policyname='material_request_items_update_by_managers') THEN
      EXECUTE 'DROP POLICY "material_request_items_update_by_managers" ON public.material_request_items';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='material_request_items' AND policyname='material_request_items_delete_by_managers') THEN
      EXECUTE 'DROP POLICY "material_request_items_delete_by_managers" ON public.material_request_items';
    END IF;

    -- Recriar policies corretas
    EXECUTE 'CREATE POLICY "material_request_items_select_also_if_parent_visible" ON public.material_request_items
      FOR SELECT TO authenticated
      USING (
        (SELECT requested_by_user_id FROM public.material_requests WHERE id = request_id) = auth.uid()
        OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN (''Admin'',''Gestor de Material'',''Coordenador'')
      )';

    EXECUTE 'CREATE POLICY "material_request_items_insert_if_request_belongs_to_user" ON public.material_request_items
      FOR INSERT TO authenticated
      WITH CHECK (
        (SELECT requested_by_user_id FROM public.material_requests WHERE id = request_id) = auth.uid()
      )';

    EXECUTE 'CREATE POLICY "material_request_items_update_by_managers" ON public.material_request_items
      FOR UPDATE TO authenticated
      USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN (''Admin'',''Gestor de Material'',''Coordenador''))
      WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN (''Admin'',''Gestor de Material'',''Coordenador''))';

    EXECUTE 'CREATE POLICY "material_request_items_delete_by_managers" ON public.material_request_items
      FOR DELETE TO authenticated
      USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN (''Admin'',''Gestor de Material'',''Coordenador''))';
  END IF;
END
$$;