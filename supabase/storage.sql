insert into storage.buckets (id, name, public)
values ('cotizaciones', 'cotizaciones', false),
       ('ordenes-compra', 'ordenes-compra', false)
on conflict (id) do nothing;

create policy "Authenticated users can read quote files"
on storage.objects for select
to authenticated
using (bucket_id in ('cotizaciones', 'ordenes-compra'));

create policy "Authenticated users can upload purchase files"
on storage.objects for insert
to authenticated
with check (bucket_id in ('cotizaciones', 'ordenes-compra'));

create policy "Authenticated users can update purchase files"
on storage.objects for update
to authenticated
using (bucket_id in ('cotizaciones', 'ordenes-compra'));
