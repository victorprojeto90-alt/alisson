-- ============================================================
-- AMBISAFE — Banco de Espécies (species_database)
-- Migração para aplicação manual (Supabase Studio / CLI vinculado
-- pelo usuário). Este projeto não tem CLI vinculado ao Supabase
-- do AMBISAFE (jwbnjzqbjmilhmtgyidf) nesta máquina — não é possível
-- executar este script automaticamente.
--
-- Origem dos dados: array estático BANCO_ESPECIES que existia em
-- src/app/pages/Especies.tsx (140 espécies). Após rodar esta migração,
-- Especies.tsx passa a consultar esta tabela via Supabase; o array
-- estático foi mantido no arquivo apenas porque AdminPage.tsx
-- (aba Banco de Espécies, fora do escopo desta mudança) ainda o usa.
-- ============================================================

create extension if not exists pg_trgm;

create table if not exists public.species_database (
  id uuid primary key default gen_random_uuid(),
  nome_popular text not null,
  nome_cientifico text not null,
  familia text not null,
  bioma text not null,
  grupo_sucessional text not null,
  estado text,
  created_at timestamptz not null default now()
);

create index if not exists species_database_bioma_idx
  on public.species_database (bioma);

create index if not exists species_database_nome_popular_trgm_idx
  on public.species_database using gin (nome_popular gin_trgm_ops);

create index if not exists species_database_nome_cientifico_trgm_idx
  on public.species_database using gin (nome_cientifico gin_trgm_ops);

create index if not exists species_database_familia_trgm_idx
  on public.species_database using gin (familia gin_trgm_ops);

alter table public.species_database enable row level security;

drop policy if exists species_database_select_authenticated on public.species_database;
create policy species_database_select_authenticated
  on public.species_database
  for select
  to authenticated
  using (true);

-- Seed (140 espécies)
insert into public.species_database (nome_popular, nome_cientifico, familia, bioma, grupo_sucessional, estado) values
  ('Aroeira do Sertão', 'Myracrodruon urundeuva', 'Anacardiaceae', 'caatinga', 'Secundária Tardia', 'PB, PE, CE, RN, BA, PI, MA, SE, AL'),
  ('Angico', 'Anadenanthera colubrina', 'Fabaceae', 'caatinga', 'Secundária Tardia', 'PB, PE, CE, RN, BA, PI, MA, SE, AL'),
  ('Braúna', 'Schinopsis brasiliensis', 'Anacardiaceae', 'caatinga', 'Secundária Tardia', 'PB, PE, CE, RN, BA, PI, MA, SE, AL'),
  ('Juazeiro', 'Ziziphus joazeiro', 'Rhamnaceae', 'caatinga', 'Secundária Inicial', 'PB, PE, CE, RN, BA, PI, MA, SE, AL'),
  ('Mandacaru', 'Cereus jamacaru', 'Cactaceae', 'caatinga', 'Pioneira', 'PB, PE, CE, RN, BA, PI, MA, SE, AL'),
  ('Catingueira', 'Poincianella pyramidalis', 'Fabaceae', 'caatinga', 'Secundária Inicial', 'PB, PE, CE, RN, BA, PI, MA, SE, AL'),
  ('Jurema Preta', 'Mimosa tenuiflora', 'Fabaceae', 'caatinga', 'Pioneira', 'PB, PE, CE, RN, BA, PI, MA, SE, AL'),
  ('Jurema Branca', 'Mimosa hostilis', 'Fabaceae', 'caatinga', 'Pioneira', 'PB, PE, CE, RN, BA, PI, MA, SE, AL'),
  ('Umbuzeiro', 'Spondias tuberosa', 'Anacardiaceae', 'caatinga', 'Secundária Inicial', 'PB, PE, CE, RN, BA, PI, MA, SE, AL'),
  ('Maniçoba', 'Manihot glaziovii', 'Euphorbiaceae', 'caatinga', 'Pioneira', 'PB, PE, CE, RN, BA, PI, MA, SE, AL'),
  ('Pereiro', 'Aspidosperma pyrifolium', 'Apocynaceae', 'caatinga', 'Secundária Tardia', 'PB, PE, CE, RN, BA, PI, MA, SE, AL'),
  ('Marmeleiro', 'Croton sonderianus', 'Euphorbiaceae', 'caatinga', 'Pioneira', 'PB, PE, CE, RN, BA, PI, MA, SE, AL'),
  ('Favela', 'Cnidoscolus quercifolius', 'Euphorbiaceae', 'caatinga', 'Pioneira', 'PB, PE, CE, RN, BA, PI, MA, SE, AL'),
  ('Xique-xique', 'Pilosocereus gounellei', 'Cactaceae', 'caatinga', 'Pioneira', 'PB, PE, CE, RN, BA, PI, MA, SE, AL'),
  ('Faveleiro', 'Cnidoscolus phyllacanthus', 'Euphorbiaceae', 'caatinga', 'Pioneira', 'PB, PE, CE, RN, BA, PI, MA, SE, AL'),
  ('Pinhão Bravo', 'Jatropha mollissima', 'Euphorbiaceae', 'caatinga', 'Pioneira', 'PB, PE, CE, RN, BA, PI, MA, SE, AL'),
  ('Pau-branco', 'Auxemma oncocalyx', 'Boraginaceae', 'caatinga', 'Secundária Tardia', 'PB, PE, CE, RN, BA, PI, MA, SE, AL'),
  ('Imburana', 'Amburana cearensis', 'Fabaceae', 'caatinga', 'Secundária Tardia', 'PB, PE, CE, RN, BA, PI, MA, SE, AL'),
  ('Baraúna', 'Schinopsis brasiliensis', 'Anacardiaceae', 'caatinga', 'Secundária Tardia', 'PB, PE, CE, RN, BA, PI, MA, SE, AL'),
  ('Sabiá', 'Mimosa caesalpiniifolia', 'Fabaceae', 'caatinga', 'Pioneira', 'PB, PE, CE, RN, BA, PI, MA, SE, AL'),
  ('Craibeira', 'Tabebuia aurea', 'Bignoniaceae', 'caatinga', 'Secundária Inicial', 'PB, PE, CE, RN, BA, PI, MA, SE, AL'),
  ('Pau-d''arco', 'Handroanthus impetiginosus', 'Bignoniaceae', 'caatinga', 'Secundária Tardia', 'PB, PE, CE, RN, BA, PI, MA, SE, AL'),
  ('Quixabeira', 'Sideroxylon obtusifolium', 'Sapotaceae', 'caatinga', 'Secundária Tardia', 'PB, PE, CE, RN, BA, PI, MA, SE, AL'),
  ('Feijão-bravo', 'Capparis flexuosa', 'Capparaceae', 'caatinga', 'Pioneira', 'PB, PE, CE, RN, BA, PI, MA, SE, AL'),
  ('Icó', 'Capparis yco', 'Capparaceae', 'caatinga', 'Secundária Inicial', 'PB, PE, CE, RN, BA, PI, MA, SE, AL'),
  ('Pau-ferro', 'Libidibia ferrea', 'Fabaceae', 'caatinga', 'Secundária Tardia', 'PB, PE, CE, RN, BA, PI, MA, SE, AL'),
  ('Mororó', 'Bauhinia cheilantha', 'Fabaceae', 'caatinga', 'Secundária Inicial', 'PB, PE, CE, RN, BA, PI, MA, SE, AL'),
  ('Facheiro', 'Pilosocereus pachycladus', 'Cactaceae', 'caatinga', 'Pioneira', 'PB, PE, CE, RN, BA, PI, MA, SE, AL'),
  ('Coroa-de-frade', 'Melocactus zehntneri', 'Cactaceae', 'caatinga', 'Pioneira', 'PB, PE, CE, RN, BA, PI, MA, SE, AL'),
  ('Cumaru da Caatinga', 'Amburana cearensis', 'Fabaceae', 'caatinga', 'Secundária Tardia', 'PB, PE, CE, RN, BA, PI, MA, SE, AL'),
  ('Cássia', 'Senna spectabilis', 'Fabaceae', 'caatinga', 'Pioneira', 'PB, PE, CE, RN, BA, PI, MA, SE, AL'),
  ('Baraúna-branca', 'Cordia oncocalyx', 'Boraginaceae', 'caatinga', 'Secundária Tardia', 'PB, PE, CE, RN, BA, PI, MA, SE, AL'),
  ('Umburana-de-cheiro', 'Commiphora leptophloeos', 'Burseraceae', 'caatinga', 'Secundária Inicial', 'PB, PE, CE, RN, BA, PI, MA, SE, AL'),
  ('Tamboril', 'Enterolobium contortisiliquum', 'Fabaceae', 'caatinga', 'Secundária Tardia', 'PB, PE, CE, RN, BA, PI, MA, SE, AL'),
  ('Ipê Amarelo', 'Handroanthus chrysotrichus', 'Bignoniaceae', 'caatinga', 'Secundária Tardia', 'PB, PE, CE, RN, BA, PI, MA, SE, AL'),
  ('Palmatória', 'Tacinga palmadora', 'Cactaceae', 'caatinga', 'Pioneira', 'PB, PE, CE, RN, BA, PI, MA, SE, AL'),
  ('Velame', 'Croton campestris', 'Euphorbiaceae', 'caatinga', 'Pioneira', 'PB, PE, CE, RN, BA, PI, MA, SE, AL'),
  ('Mulungu', 'Erythrina velutina', 'Fabaceae', 'caatinga', 'Pioneira', 'PB, PE, CE, RN, BA, PI, MA, SE, AL'),
  ('Catanduva', 'Piptadenia moniliformis', 'Fabaceae', 'caatinga', 'Secundária Inicial', 'PB, PE, CE, RN, BA, PI, MA, SE, AL'),
  ('Pequi', 'Caryocar brasiliense', 'Caryocaraceae', 'cerrado', 'Secundária Tardia', NULL),
  ('Ipê Amarelo', 'Handroanthus albus', 'Bignoniaceae', 'cerrado', 'Secundária Tardia', NULL),
  ('Cagaita', 'Eugenia dysenterica', 'Myrtaceae', 'cerrado', 'Secundária Inicial', NULL),
  ('Baru', 'Dipteryx alata', 'Fabaceae', 'cerrado', 'Secundária Tardia', NULL),
  ('Buriti', 'Mauritia flexuosa', 'Arecaceae', 'cerrado', 'Secundária Inicial', NULL),
  ('Sucupira Preta', 'Bowdichia virgilioides', 'Fabaceae', 'cerrado', 'Secundária Tardia', NULL),
  ('Canela-de-Ema', 'Vellozia squamata', 'Velloziaceae', 'cerrado', 'Pioneira', NULL),
  ('Murici', 'Byrsonima crassifolia', 'Malpighiaceae', 'cerrado', 'Secundária Inicial', NULL),
  ('Jatobá do Cerrado', 'Hymenaea stigonocarpa', 'Fabaceae', 'cerrado', 'Secundária Tardia', NULL),
  ('Angico do Cerrado', 'Anadenanthera peregrina', 'Fabaceae', 'cerrado', 'Secundária Inicial', NULL),
  ('Ipê Roxo do Cerrado', 'Handroanthus ochraceus', 'Bignoniaceae', 'cerrado', 'Secundária Tardia', NULL),
  ('Pau-santo', 'Kielmeyera coriacea', 'Calophyllaceae', 'cerrado', 'Pioneira', NULL),
  ('Barbatimão', 'Stryphnodendron adstringens', 'Fabaceae', 'cerrado', 'Secundária Inicial', NULL),
  ('Gonçalo-alves', 'Astronium fraxinifolium', 'Anacardiaceae', 'cerrado', 'Secundária Tardia', NULL),
  ('Pau-terra', 'Qualea grandiflora', 'Vochysiaceae', 'cerrado', 'Secundária Inicial', NULL),
  ('Lobeira', 'Solanum lycocarpum', 'Solanaceae', 'cerrado', 'Pioneira', NULL),
  ('Mangaba', 'Hancornia speciosa', 'Apocynaceae', 'cerrado', 'Secundária Inicial', NULL),
  ('Aroeira do Cerrado', 'Myracrodruon urundeuva', 'Anacardiaceae', 'cerrado', 'Secundária Tardia', NULL),
  ('Copaíba do Cerrado', 'Copaifera langsdorffii', 'Fabaceae', 'cerrado', 'Secundária Tardia', NULL),
  ('Faveiro', 'Dimorphandra mollis', 'Fabaceae', 'cerrado', 'Secundária Inicial', NULL),
  ('Lixeira', 'Curatella americana', 'Dilleniaceae', 'cerrado', 'Secundária Inicial', NULL),
  ('Coco Indaiá', 'Attalea geraensis', 'Arecaceae', 'cerrado', 'Secundária Tardia', NULL),
  ('Araticum', 'Annona crassiflora', 'Annonaceae', 'cerrado', 'Secundária Inicial', NULL),
  ('Tingui', 'Magonia pubescens', 'Sapindaceae', 'cerrado', 'Secundária Tardia', NULL),
  ('Sucupira Branca', 'Pterodon pubescens', 'Fabaceae', 'cerrado', 'Secundária Tardia', NULL),
  ('Ipê Roxo', 'Handroanthus impetiginosus', 'Bignoniaceae', 'mata_atlantica', 'Secundária Tardia', NULL),
  ('Cedro', 'Cedrela fissilis', 'Meliaceae', 'mata_atlantica', 'Secundária Tardia', NULL),
  ('Jequitibá', 'Cariniana legalis', 'Lecythidaceae', 'mata_atlantica', 'Secundária Tardia', NULL),
  ('Pau-brasil', 'Paubrasilia echinata', 'Fabaceae', 'mata_atlantica', 'Secundária Tardia', NULL),
  ('Embaúba', 'Cecropia pachystachya', 'Urticaceae', 'mata_atlantica', 'Pioneira', NULL),
  ('Ingá', 'Inga edulis', 'Fabaceae', 'mata_atlantica', 'Pioneira', NULL),
  ('Guapuruvu', 'Schizolobium parahyba', 'Fabaceae', 'mata_atlantica', 'Pioneira', NULL),
  ('Canela Sassafrás', 'Ocotea odorifera', 'Lauraceae', 'mata_atlantica', 'Secundária Tardia', NULL),
  ('Guarantã', 'Esenbeckia leiocarpa', 'Rutaceae', 'mata_atlantica', 'Secundária Tardia', NULL),
  ('Aroeira Pimenteira', 'Schinus terebinthifolia', 'Anacardiaceae', 'mata_atlantica', 'Pioneira', NULL),
  ('Jacarandá-da-bahia', 'Dalbergia nigra', 'Fabaceae', 'mata_atlantica', 'Secundária Tardia', NULL),
  ('Peroba-rosa', 'Aspidosperma polyneuron', 'Apocynaceae', 'mata_atlantica', 'Secundária Tardia', NULL),
  ('Canjarana', 'Cabralea canjerana', 'Meliaceae', 'mata_atlantica', 'Secundária Tardia', NULL),
  ('Araucária', 'Araucaria angustifolia', 'Araucariaceae', 'mata_atlantica', 'Secundária Tardia', NULL),
  ('Canela-preta', 'Nectandra megapotamica', 'Lauraceae', 'mata_atlantica', 'Secundária Tardia', NULL),
  ('Jerivá', 'Syagrus romanzoffiana', 'Arecaceae', 'mata_atlantica', 'Secundária Inicial', NULL),
  ('Tapiá', 'Alchornea glandulosa', 'Euphorbiaceae', 'mata_atlantica', 'Pioneira', NULL),
  ('Capixingui', 'Croton floribundus', 'Euphorbiaceae', 'mata_atlantica', 'Pioneira', NULL),
  ('Angico-vermelho', 'Parapiptadenia rigida', 'Fabaceae', 'mata_atlantica', 'Secundária Tardia', NULL),
  ('Palmito-juçara', 'Euterpe edulis', 'Arecaceae', 'mata_atlantica', 'Secundária Tardia', NULL),
  ('Imbuia', 'Ocotea porosa', 'Lauraceae', 'mata_atlantica', 'Secundária Tardia', NULL),
  ('Canela Preta', 'Ocotea catharinensis', 'Lauraceae', 'mata_atlantica', 'Secundária Tardia', NULL),
  ('Jacatirão', 'Miconia cinnamomifolia', 'Melastomataceae', 'mata_atlantica', 'Pioneira', NULL),
  ('Pau Jacaré', 'Piptadenia gonoacantha', 'Fabaceae', 'mata_atlantica', 'Pioneira', NULL),
  ('Quaresmeira', 'Tibouchina granulosa', 'Melastomataceae', 'mata_atlantica', 'Pioneira', NULL),
  ('Gameleira', 'Ficus gomelleira', 'Moraceae', 'mata_atlantica', 'Secundária Tardia', NULL),
  ('Mogno', 'Swietenia macrophylla', 'Meliaceae', 'amazonia', 'Secundária Tardia', NULL),
  ('Castanheira', 'Bertholletia excelsa', 'Lecythidaceae', 'amazonia', 'Secundária Tardia', NULL),
  ('Copaíba', 'Copaifera langsdorffii', 'Fabaceae', 'amazonia', 'Secundária Tardia', NULL),
  ('Andiroba', 'Carapa guianensis', 'Meliaceae', 'amazonia', 'Secundária Tardia', NULL),
  ('Açaí', 'Euterpe oleracea', 'Arecaceae', 'amazonia', 'Secundária Inicial', NULL),
  ('Seringueira', 'Hevea brasiliensis', 'Euphorbiaceae', 'amazonia', 'Secundária Inicial', NULL),
  ('Jatobá da Amazônia', 'Hymenaea courbaril', 'Fabaceae', 'amazonia', 'Secundária Tardia', NULL),
  ('Sumaúma', 'Ceiba pentandra', 'Malvaceae', 'amazonia', 'Pioneira', NULL),
  ('Angico da Amazônia', 'Anadenanthera peregrina var. falcata', 'Fabaceae', 'amazonia', 'Secundária Inicial', NULL),
  ('Cumaru', 'Dipteryx odorata', 'Fabaceae', 'amazonia', 'Secundária Tardia', NULL),
  ('Ipê da Amazônia', 'Handroanthus serratifolius', 'Bignoniaceae', 'amazonia', 'Secundária Tardia', NULL),
  ('Maçaranduba', 'Manilkara huberi', 'Sapotaceae', 'amazonia', 'Secundária Tardia', NULL),
  ('Cedro-rosa', 'Cedrela odorata', 'Meliaceae', 'amazonia', 'Secundária Tardia', NULL),
  ('Freijó', 'Cordia goeldiana', 'Boraginaceae', 'amazonia', 'Secundária Tardia', NULL),
  ('Buriti da Amazônia', 'Mauritia flexuosa', 'Arecaceae', 'amazonia', 'Secundária Inicial', NULL),
  ('Piquiá', 'Caryocar villosum', 'Caryocaraceae', 'amazonia', 'Secundária Tardia', NULL),
  ('Pau d''arco Amarelo', 'Handroanthus impetiginosus', 'Bignoniaceae', 'amazonia', 'Secundária Tardia', NULL),
  ('Embaúba da Amazônia', 'Cecropia palmata', 'Urticaceae', 'amazonia', 'Pioneira', NULL),
  ('Tauari', 'Couratari guianensis', 'Lecythidaceae', 'amazonia', 'Secundária Tardia', NULL),
  ('Louro Preto', 'Ocotea fragrantissima', 'Lauraceae', 'amazonia', 'Secundária Tardia', NULL),
  ('Copaíba', 'Copaifera multijuga', 'Fabaceae', 'amazonia', 'Secundária Tardia', NULL),
  ('Ipê do Amazonas', 'Handroanthus barbatus', 'Bignoniaceae', 'amazonia', 'Secundária Tardia', NULL),
  ('Angelim Pedra', 'Hymenolobium petraeum', 'Fabaceae', 'amazonia', 'Secundária Tardia', NULL),
  ('Virola', 'Virola surinamensis', 'Myristicaceae', 'amazonia', 'Secundária Inicial', NULL),
  ('Cedrorana', 'Cedrelinga cateniformis', 'Fabaceae', 'amazonia', 'Secundária Tardia', NULL),
  ('Itaúba', 'Mezilaurus itauba', 'Lauraceae', 'amazonia', 'Secundária Tardia', NULL),
  ('Açoita-cavalo', 'Luehea divaricata', 'Malvaceae', 'pampa', 'Secundária Inicial', NULL),
  ('Branquilho', 'Sebastiania commersoniana', 'Euphorbiaceae', 'pampa', 'Secundária Inicial', NULL),
  ('Camboatá Vermelho', 'Cupania vernalis', 'Sapindaceae', 'pampa', 'Secundária Tardia', NULL),
  ('Cincho', 'Sorocea bonplandii', 'Moraceae', 'pampa', 'Secundária Tardia', NULL),
  ('Coronilha', 'Scutia buxifolia', 'Rhamnaceae', 'pampa', 'Secundária Tardia', NULL),
  ('Aroeira Vermelha', 'Schinus terebinthifolia', 'Anacardiaceae', 'pampa', 'Pioneira', NULL),
  ('Timbaúva', 'Enterolobium contortisiliquum', 'Fabaceae', 'pampa', 'Secundária Tardia', NULL),
  ('Ingá do Pampa', 'Inga vera', 'Fabaceae', 'pampa', 'Pioneira', NULL),
  ('Espinilho', 'Vachellia caven', 'Fabaceae', 'pampa', 'Pioneira', NULL),
  ('Pitangueira', 'Eugenia uniflora', 'Myrtaceae', 'pampa', 'Secundária Inicial', NULL),
  ('Butiá', 'Butia odorata', 'Arecaceae', 'pampa', 'Secundária Tardia', NULL),
  ('Canela Guaicá', 'Ocotea puberula', 'Lauraceae', 'pampa', 'Secundária Inicial', NULL),
  ('Angico Vermelho', 'Parapiptadenia rigida', 'Fabaceae', 'pampa', 'Secundária Inicial', NULL),
  ('Paratudo', 'Tabebuia aurea', 'Bignoniaceae', 'pantanal', 'Secundária Inicial', NULL),
  ('Bocaiuva', 'Acrocomia aculeata', 'Arecaceae', 'pantanal', 'Pioneira', NULL),
  ('Carandá', 'Copernicia alba', 'Arecaceae', 'pantanal', 'Secundária Inicial', NULL),
  ('Cambará', 'Vochysia divergens', 'Vochysiaceae', 'pantanal', 'Pioneira', NULL),
  ('Piúva', 'Handroanthus impetiginosus', 'Bignoniaceae', 'pantanal', 'Secundária Tardia', NULL),
  ('Angico do Pantanal', 'Anadenanthera colubrina', 'Fabaceae', 'pantanal', 'Secundária Tardia', NULL),
  ('Figueira', 'Ficus guaranitica', 'Moraceae', 'pantanal', 'Secundária Inicial', NULL),
  ('Ximbuva', 'Enterolobium contortisiliquum', 'Fabaceae', 'pantanal', 'Secundária Tardia', NULL),
  ('Landi', 'Calophyllum brasiliense', 'Calophyllaceae', 'pantanal', 'Secundária Tardia', NULL),
  ('Figueira do Pantanal', 'Ficus pertusa', 'Moraceae', 'pantanal', 'Secundária Inicial', NULL),
  ('Tarumã', 'Vitex cymosa', 'Lamiaceae', 'pantanal', 'Secundária Inicial', NULL);
