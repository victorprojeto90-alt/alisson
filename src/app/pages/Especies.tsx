import { useState, useMemo } from 'react';
import { Search, Download, Leaf, Info } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export interface Especie {
  nome_popular: string;
  nome_cientifico: string;
  familia: string;
  bioma: string;
  grupo_sucessional: string;
  estado?: string;
}

// Banco de dados de espécies por estado/bioma (base IFN)
// Exportado para a aba "Banco de Espécies" do painel admin (leitura, ver AdminPage.tsx —
// adicionar/editar/remover exigiria mover esses dados para uma tabela real no Supabase,
// já que hoje é só um array estático embutido no bundle).
export const BANCO_ESPECIES: Especie[] = [
  // Caatinga — Paraíba, PE, CE, RN, PI, SE, AL, BA
  { nome_popular: 'Aroeira do Sertão', nome_cientifico: 'Myracrodruon urundeuva', familia: 'Anacardiaceae', bioma: 'caatinga', grupo_sucessional: 'Secundária Tardia', estado: 'PB, PE, CE, RN, BA, PI, MA, SE, AL' },
  { nome_popular: 'Angico', nome_cientifico: 'Anadenanthera colubrina', familia: 'Fabaceae', bioma: 'caatinga', grupo_sucessional: 'Secundária Tardia', estado: 'PB, PE, CE, RN, BA, PI, MA, SE, AL' },
  { nome_popular: 'Braúna', nome_cientifico: 'Schinopsis brasiliensis', familia: 'Anacardiaceae', bioma: 'caatinga', grupo_sucessional: 'Secundária Tardia', estado: 'PB, PE, CE, RN, BA, PI, MA, SE, AL' },
  { nome_popular: 'Juazeiro', nome_cientifico: 'Ziziphus joazeiro', familia: 'Rhamnaceae', bioma: 'caatinga', grupo_sucessional: 'Secundária Inicial', estado: 'PB, PE, CE, RN, BA, PI, MA, SE, AL' },
  { nome_popular: 'Mandacaru', nome_cientifico: 'Cereus jamacaru', familia: 'Cactaceae', bioma: 'caatinga', grupo_sucessional: 'Pioneira', estado: 'PB, PE, CE, RN, BA, PI, MA, SE, AL' },
  { nome_popular: 'Catingueira', nome_cientifico: 'Poincianella pyramidalis', familia: 'Fabaceae', bioma: 'caatinga', grupo_sucessional: 'Secundária Inicial', estado: 'PB, PE, CE, RN, BA, PI, MA, SE, AL' },
  { nome_popular: 'Jurema Preta', nome_cientifico: 'Mimosa tenuiflora', familia: 'Fabaceae', bioma: 'caatinga', grupo_sucessional: 'Pioneira', estado: 'PB, PE, CE, RN, BA, PI, MA, SE, AL' },
  { nome_popular: 'Jurema Branca', nome_cientifico: 'Mimosa hostilis', familia: 'Fabaceae', bioma: 'caatinga', grupo_sucessional: 'Pioneira', estado: 'PB, PE, CE, RN, BA, PI, MA, SE, AL' },
  { nome_popular: 'Umbuzeiro', nome_cientifico: 'Spondias tuberosa', familia: 'Anacardiaceae', bioma: 'caatinga', grupo_sucessional: 'Secundária Inicial', estado: 'PB, PE, CE, RN, BA, PI, MA, SE, AL' },
  { nome_popular: 'Maniçoba', nome_cientifico: 'Manihot glaziovii', familia: 'Euphorbiaceae', bioma: 'caatinga', grupo_sucessional: 'Pioneira', estado: 'PB, PE, CE, RN, BA, PI, MA, SE, AL' },
  { nome_popular: 'Pereiro', nome_cientifico: 'Aspidosperma pyrifolium', familia: 'Apocynaceae', bioma: 'caatinga', grupo_sucessional: 'Secundária Tardia', estado: 'PB, PE, CE, RN, BA, PI, MA, SE, AL' },
  { nome_popular: 'Marmeleiro', nome_cientifico: 'Croton sonderianus', familia: 'Euphorbiaceae', bioma: 'caatinga', grupo_sucessional: 'Pioneira', estado: 'PB, PE, CE, RN, BA, PI, MA, SE, AL' },
  { nome_popular: 'Favela', nome_cientifico: 'Cnidoscolus quercifolius', familia: 'Euphorbiaceae', bioma: 'caatinga', grupo_sucessional: 'Pioneira', estado: 'PB, PE, CE, RN, BA, PI, MA, SE, AL' },
  { nome_popular: 'Xique-xique', nome_cientifico: 'Pilosocereus gounellei', familia: 'Cactaceae', bioma: 'caatinga', grupo_sucessional: 'Pioneira', estado: 'PB, PE, CE, RN, BA, PI, MA, SE, AL' },
  { nome_popular: 'Faveleiro', nome_cientifico: 'Cnidoscolus phyllacanthus', familia: 'Euphorbiaceae', bioma: 'caatinga', grupo_sucessional: 'Pioneira', estado: 'PB, PE, CE, RN, BA, PI, MA, SE, AL' },
  { nome_popular: 'Pinhão Bravo', nome_cientifico: 'Jatropha mollissima', familia: 'Euphorbiaceae', bioma: 'caatinga', grupo_sucessional: 'Pioneira', estado: 'PB, PE, CE, RN, BA, PI, MA, SE, AL' },
  { nome_popular: 'Pau-branco', nome_cientifico: 'Auxemma oncocalyx', familia: 'Boraginaceae', bioma: 'caatinga', grupo_sucessional: 'Secundária Tardia', estado: 'PB, PE, CE, RN, BA, PI, MA, SE, AL' },
  { nome_popular: 'Imburana', nome_cientifico: 'Amburana cearensis', familia: 'Fabaceae', bioma: 'caatinga', grupo_sucessional: 'Secundária Tardia', estado: 'PB, PE, CE, RN, BA, PI, MA, SE, AL' },
  { nome_popular: 'Baraúna', nome_cientifico: 'Schinopsis brasiliensis', familia: 'Anacardiaceae', bioma: 'caatinga', grupo_sucessional: 'Secundária Tardia', estado: 'PB, PE, CE, RN, BA, PI, MA, SE, AL' },
  { nome_popular: 'Sabiá', nome_cientifico: 'Mimosa caesalpiniifolia', familia: 'Fabaceae', bioma: 'caatinga', grupo_sucessional: 'Pioneira', estado: 'PB, PE, CE, RN, BA, PI, MA, SE, AL' },
  { nome_popular: 'Craibeira', nome_cientifico: 'Tabebuia aurea', familia: 'Bignoniaceae', bioma: 'caatinga', grupo_sucessional: 'Secundária Inicial', estado: 'PB, PE, CE, RN, BA, PI, MA, SE, AL' },
  { nome_popular: 'Pau-d\'arco', nome_cientifico: 'Handroanthus impetiginosus', familia: 'Bignoniaceae', bioma: 'caatinga', grupo_sucessional: 'Secundária Tardia', estado: 'PB, PE, CE, RN, BA, PI, MA, SE, AL' },
  { nome_popular: 'Quixabeira', nome_cientifico: 'Sideroxylon obtusifolium', familia: 'Sapotaceae', bioma: 'caatinga', grupo_sucessional: 'Secundária Tardia', estado: 'PB, PE, CE, RN, BA, PI, MA, SE, AL' },
  { nome_popular: 'Feijão-bravo', nome_cientifico: 'Capparis flexuosa', familia: 'Capparaceae', bioma: 'caatinga', grupo_sucessional: 'Pioneira', estado: 'PB, PE, CE, RN, BA, PI, MA, SE, AL' },
  { nome_popular: 'Icó', nome_cientifico: 'Capparis yco', familia: 'Capparaceae', bioma: 'caatinga', grupo_sucessional: 'Secundária Inicial', estado: 'PB, PE, CE, RN, BA, PI, MA, SE, AL' },
  { nome_popular: 'Pau-ferro', nome_cientifico: 'Libidibia ferrea', familia: 'Fabaceae', bioma: 'caatinga', grupo_sucessional: 'Secundária Tardia', estado: 'PB, PE, CE, RN, BA, PI, MA, SE, AL' },
  { nome_popular: 'Mororó', nome_cientifico: 'Bauhinia cheilantha', familia: 'Fabaceae', bioma: 'caatinga', grupo_sucessional: 'Secundária Inicial', estado: 'PB, PE, CE, RN, BA, PI, MA, SE, AL' },
  { nome_popular: 'Facheiro', nome_cientifico: 'Pilosocereus pachycladus', familia: 'Cactaceae', bioma: 'caatinga', grupo_sucessional: 'Pioneira', estado: 'PB, PE, CE, RN, BA, PI, MA, SE, AL' },
  { nome_popular: 'Coroa-de-frade', nome_cientifico: 'Melocactus zehntneri', familia: 'Cactaceae', bioma: 'caatinga', grupo_sucessional: 'Pioneira', estado: 'PB, PE, CE, RN, BA, PI, MA, SE, AL' },
  { nome_popular: 'Cumaru da Caatinga', nome_cientifico: 'Amburana cearensis', familia: 'Fabaceae', bioma: 'caatinga', grupo_sucessional: 'Secundária Tardia', estado: 'PB, PE, CE, RN, BA, PI, MA, SE, AL' },
  { nome_popular: 'Cássia', nome_cientifico: 'Senna spectabilis', familia: 'Fabaceae', bioma: 'caatinga', grupo_sucessional: 'Pioneira', estado: 'PB, PE, CE, RN, BA, PI, MA, SE, AL' },
  { nome_popular: 'Baraúna-branca', nome_cientifico: 'Cordia oncocalyx', familia: 'Boraginaceae', bioma: 'caatinga', grupo_sucessional: 'Secundária Tardia', estado: 'PB, PE, CE, RN, BA, PI, MA, SE, AL' },
  { nome_popular: 'Umburana-de-cheiro', nome_cientifico: 'Commiphora leptophloeos', familia: 'Burseraceae', bioma: 'caatinga', grupo_sucessional: 'Secundária Inicial', estado: 'PB, PE, CE, RN, BA, PI, MA, SE, AL' },
  { nome_popular: 'Tamboril', nome_cientifico: 'Enterolobium contortisiliquum', familia: 'Fabaceae', bioma: 'caatinga', grupo_sucessional: 'Secundária Tardia', estado: 'PB, PE, CE, RN, BA, PI, MA, SE, AL' },
  { nome_popular: 'Ipê Amarelo', nome_cientifico: 'Handroanthus chrysotrichus', familia: 'Bignoniaceae', bioma: 'caatinga', grupo_sucessional: 'Secundária Tardia', estado: 'PB, PE, CE, RN, BA, PI, MA, SE, AL' },
  { nome_popular: 'Palmatória', nome_cientifico: 'Tacinga palmadora', familia: 'Cactaceae', bioma: 'caatinga', grupo_sucessional: 'Pioneira', estado: 'PB, PE, CE, RN, BA, PI, MA, SE, AL' },
  { nome_popular: 'Velame', nome_cientifico: 'Croton campestris', familia: 'Euphorbiaceae', bioma: 'caatinga', grupo_sucessional: 'Pioneira', estado: 'PB, PE, CE, RN, BA, PI, MA, SE, AL' },
  { nome_popular: 'Mulungu', nome_cientifico: 'Erythrina velutina', familia: 'Fabaceae', bioma: 'caatinga', grupo_sucessional: 'Pioneira', estado: 'PB, PE, CE, RN, BA, PI, MA, SE, AL' },
  { nome_popular: 'Catanduva', nome_cientifico: 'Piptadenia moniliformis', familia: 'Fabaceae', bioma: 'caatinga', grupo_sucessional: 'Secundária Inicial', estado: 'PB, PE, CE, RN, BA, PI, MA, SE, AL' },
  // Cerrado
  { nome_popular: 'Pequi', nome_cientifico: 'Caryocar brasiliense', familia: 'Caryocaraceae', bioma: 'cerrado', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Ipê Amarelo', nome_cientifico: 'Handroanthus albus', familia: 'Bignoniaceae', bioma: 'cerrado', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Cagaita', nome_cientifico: 'Eugenia dysenterica', familia: 'Myrtaceae', bioma: 'cerrado', grupo_sucessional: 'Secundária Inicial' },
  { nome_popular: 'Baru', nome_cientifico: 'Dipteryx alata', familia: 'Fabaceae', bioma: 'cerrado', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Buriti', nome_cientifico: 'Mauritia flexuosa', familia: 'Arecaceae', bioma: 'cerrado', grupo_sucessional: 'Secundária Inicial' },
  { nome_popular: 'Sucupira Preta', nome_cientifico: 'Bowdichia virgilioides', familia: 'Fabaceae', bioma: 'cerrado', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Canela-de-Ema', nome_cientifico: 'Vellozia squamata', familia: 'Velloziaceae', bioma: 'cerrado', grupo_sucessional: 'Pioneira' },
  { nome_popular: 'Murici', nome_cientifico: 'Byrsonima crassifolia', familia: 'Malpighiaceae', bioma: 'cerrado', grupo_sucessional: 'Secundária Inicial' },
  { nome_popular: 'Jatobá do Cerrado', nome_cientifico: 'Hymenaea stigonocarpa', familia: 'Fabaceae', bioma: 'cerrado', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Angico do Cerrado', nome_cientifico: 'Anadenanthera peregrina', familia: 'Fabaceae', bioma: 'cerrado', grupo_sucessional: 'Secundária Inicial' },
  { nome_popular: 'Ipê Roxo do Cerrado', nome_cientifico: 'Handroanthus ochraceus', familia: 'Bignoniaceae', bioma: 'cerrado', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Pau-santo', nome_cientifico: 'Kielmeyera coriacea', familia: 'Calophyllaceae', bioma: 'cerrado', grupo_sucessional: 'Pioneira' },
  { nome_popular: 'Barbatimão', nome_cientifico: 'Stryphnodendron adstringens', familia: 'Fabaceae', bioma: 'cerrado', grupo_sucessional: 'Secundária Inicial' },
  { nome_popular: 'Gonçalo-alves', nome_cientifico: 'Astronium fraxinifolium', familia: 'Anacardiaceae', bioma: 'cerrado', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Pau-terra', nome_cientifico: 'Qualea grandiflora', familia: 'Vochysiaceae', bioma: 'cerrado', grupo_sucessional: 'Secundária Inicial' },
  { nome_popular: 'Lobeira', nome_cientifico: 'Solanum lycocarpum', familia: 'Solanaceae', bioma: 'cerrado', grupo_sucessional: 'Pioneira' },
  { nome_popular: 'Mangaba', nome_cientifico: 'Hancornia speciosa', familia: 'Apocynaceae', bioma: 'cerrado', grupo_sucessional: 'Secundária Inicial' },
  { nome_popular: 'Aroeira do Cerrado', nome_cientifico: 'Myracrodruon urundeuva', familia: 'Anacardiaceae', bioma: 'cerrado', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Copaíba do Cerrado', nome_cientifico: 'Copaifera langsdorffii', familia: 'Fabaceae', bioma: 'cerrado', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Faveiro', nome_cientifico: 'Dimorphandra mollis', familia: 'Fabaceae', bioma: 'cerrado', grupo_sucessional: 'Secundária Inicial' },
  { nome_popular: 'Lixeira', nome_cientifico: 'Curatella americana', familia: 'Dilleniaceae', bioma: 'cerrado', grupo_sucessional: 'Secundária Inicial' },
  { nome_popular: 'Coco Indaiá', nome_cientifico: 'Attalea geraensis', familia: 'Arecaceae', bioma: 'cerrado', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Araticum', nome_cientifico: 'Annona crassiflora', familia: 'Annonaceae', bioma: 'cerrado', grupo_sucessional: 'Secundária Inicial' },
  { nome_popular: 'Tingui', nome_cientifico: 'Magonia pubescens', familia: 'Sapindaceae', bioma: 'cerrado', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Sucupira Branca', nome_cientifico: 'Pterodon pubescens', familia: 'Fabaceae', bioma: 'cerrado', grupo_sucessional: 'Secundária Tardia' },
  // Mata Atlântica
  { nome_popular: 'Ipê Roxo', nome_cientifico: 'Handroanthus impetiginosus', familia: 'Bignoniaceae', bioma: 'mata_atlantica', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Cedro', nome_cientifico: 'Cedrela fissilis', familia: 'Meliaceae', bioma: 'mata_atlantica', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Jequitibá', nome_cientifico: 'Cariniana legalis', familia: 'Lecythidaceae', bioma: 'mata_atlantica', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Pau-brasil', nome_cientifico: 'Paubrasilia echinata', familia: 'Fabaceae', bioma: 'mata_atlantica', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Embaúba', nome_cientifico: 'Cecropia pachystachya', familia: 'Urticaceae', bioma: 'mata_atlantica', grupo_sucessional: 'Pioneira' },
  { nome_popular: 'Ingá', nome_cientifico: 'Inga edulis', familia: 'Fabaceae', bioma: 'mata_atlantica', grupo_sucessional: 'Pioneira' },
  { nome_popular: 'Guapuruvu', nome_cientifico: 'Schizolobium parahyba', familia: 'Fabaceae', bioma: 'mata_atlantica', grupo_sucessional: 'Pioneira' },
  { nome_popular: 'Canela Sassafrás', nome_cientifico: 'Ocotea odorifera', familia: 'Lauraceae', bioma: 'mata_atlantica', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Guarantã', nome_cientifico: 'Esenbeckia leiocarpa', familia: 'Rutaceae', bioma: 'mata_atlantica', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Aroeira Pimenteira', nome_cientifico: 'Schinus terebinthifolia', familia: 'Anacardiaceae', bioma: 'mata_atlantica', grupo_sucessional: 'Pioneira' },
  { nome_popular: 'Jacarandá-da-bahia', nome_cientifico: 'Dalbergia nigra', familia: 'Fabaceae', bioma: 'mata_atlantica', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Peroba-rosa', nome_cientifico: 'Aspidosperma polyneuron', familia: 'Apocynaceae', bioma: 'mata_atlantica', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Canjarana', nome_cientifico: 'Cabralea canjerana', familia: 'Meliaceae', bioma: 'mata_atlantica', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Araucária', nome_cientifico: 'Araucaria angustifolia', familia: 'Araucariaceae', bioma: 'mata_atlantica', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Canela-preta', nome_cientifico: 'Nectandra megapotamica', familia: 'Lauraceae', bioma: 'mata_atlantica', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Jerivá', nome_cientifico: 'Syagrus romanzoffiana', familia: 'Arecaceae', bioma: 'mata_atlantica', grupo_sucessional: 'Secundária Inicial' },
  { nome_popular: 'Tapiá', nome_cientifico: 'Alchornea glandulosa', familia: 'Euphorbiaceae', bioma: 'mata_atlantica', grupo_sucessional: 'Pioneira' },
  { nome_popular: 'Capixingui', nome_cientifico: 'Croton floribundus', familia: 'Euphorbiaceae', bioma: 'mata_atlantica', grupo_sucessional: 'Pioneira' },
  { nome_popular: 'Angico-vermelho', nome_cientifico: 'Parapiptadenia rigida', familia: 'Fabaceae', bioma: 'mata_atlantica', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Palmito-juçara', nome_cientifico: 'Euterpe edulis', familia: 'Arecaceae', bioma: 'mata_atlantica', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Imbuia', nome_cientifico: 'Ocotea porosa', familia: 'Lauraceae', bioma: 'mata_atlantica', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Canela Preta', nome_cientifico: 'Ocotea catharinensis', familia: 'Lauraceae', bioma: 'mata_atlantica', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Jacatirão', nome_cientifico: 'Miconia cinnamomifolia', familia: 'Melastomataceae', bioma: 'mata_atlantica', grupo_sucessional: 'Pioneira' },
  { nome_popular: 'Pau Jacaré', nome_cientifico: 'Piptadenia gonoacantha', familia: 'Fabaceae', bioma: 'mata_atlantica', grupo_sucessional: 'Pioneira' },
  { nome_popular: 'Quaresmeira', nome_cientifico: 'Tibouchina granulosa', familia: 'Melastomataceae', bioma: 'mata_atlantica', grupo_sucessional: 'Pioneira' },
  { nome_popular: 'Gameleira', nome_cientifico: 'Ficus gomelleira', familia: 'Moraceae', bioma: 'mata_atlantica', grupo_sucessional: 'Secundária Tardia' },
  // Amazônia
  { nome_popular: 'Mogno', nome_cientifico: 'Swietenia macrophylla', familia: 'Meliaceae', bioma: 'amazonia', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Castanheira', nome_cientifico: 'Bertholletia excelsa', familia: 'Lecythidaceae', bioma: 'amazonia', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Copaíba', nome_cientifico: 'Copaifera langsdorffii', familia: 'Fabaceae', bioma: 'amazonia', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Andiroba', nome_cientifico: 'Carapa guianensis', familia: 'Meliaceae', bioma: 'amazonia', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Açaí', nome_cientifico: 'Euterpe oleracea', familia: 'Arecaceae', bioma: 'amazonia', grupo_sucessional: 'Secundária Inicial' },
  { nome_popular: 'Seringueira', nome_cientifico: 'Hevea brasiliensis', familia: 'Euphorbiaceae', bioma: 'amazonia', grupo_sucessional: 'Secundária Inicial' },
  { nome_popular: 'Jatobá da Amazônia', nome_cientifico: 'Hymenaea courbaril', familia: 'Fabaceae', bioma: 'amazonia', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Sumaúma', nome_cientifico: 'Ceiba pentandra', familia: 'Malvaceae', bioma: 'amazonia', grupo_sucessional: 'Pioneira' },
  { nome_popular: 'Angico da Amazônia', nome_cientifico: 'Anadenanthera peregrina var. falcata', familia: 'Fabaceae', bioma: 'amazonia', grupo_sucessional: 'Secundária Inicial' },
  { nome_popular: 'Cumaru', nome_cientifico: 'Dipteryx odorata', familia: 'Fabaceae', bioma: 'amazonia', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Ipê da Amazônia', nome_cientifico: 'Handroanthus serratifolius', familia: 'Bignoniaceae', bioma: 'amazonia', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Maçaranduba', nome_cientifico: 'Manilkara huberi', familia: 'Sapotaceae', bioma: 'amazonia', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Cedro-rosa', nome_cientifico: 'Cedrela odorata', familia: 'Meliaceae', bioma: 'amazonia', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Freijó', nome_cientifico: 'Cordia goeldiana', familia: 'Boraginaceae', bioma: 'amazonia', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Buriti da Amazônia', nome_cientifico: 'Mauritia flexuosa', familia: 'Arecaceae', bioma: 'amazonia', grupo_sucessional: 'Secundária Inicial' },
  { nome_popular: 'Piquiá', nome_cientifico: 'Caryocar villosum', familia: 'Caryocaraceae', bioma: 'amazonia', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Pau d\'arco Amarelo', nome_cientifico: 'Handroanthus impetiginosus', familia: 'Bignoniaceae', bioma: 'amazonia', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Embaúba da Amazônia', nome_cientifico: 'Cecropia palmata', familia: 'Urticaceae', bioma: 'amazonia', grupo_sucessional: 'Pioneira' },
  { nome_popular: 'Tauari', nome_cientifico: 'Couratari guianensis', familia: 'Lecythidaceae', bioma: 'amazonia', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Louro Preto', nome_cientifico: 'Ocotea fragrantissima', familia: 'Lauraceae', bioma: 'amazonia', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Copaíba', nome_cientifico: 'Copaifera multijuga', familia: 'Fabaceae', bioma: 'amazonia', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Ipê do Amazonas', nome_cientifico: 'Handroanthus barbatus', familia: 'Bignoniaceae', bioma: 'amazonia', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Angelim Pedra', nome_cientifico: 'Hymenolobium petraeum', familia: 'Fabaceae', bioma: 'amazonia', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Virola', nome_cientifico: 'Virola surinamensis', familia: 'Myristicaceae', bioma: 'amazonia', grupo_sucessional: 'Secundária Inicial' },
  { nome_popular: 'Cedrorana', nome_cientifico: 'Cedrelinga cateniformis', familia: 'Fabaceae', bioma: 'amazonia', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Itaúba', nome_cientifico: 'Mezilaurus itauba', familia: 'Lauraceae', bioma: 'amazonia', grupo_sucessional: 'Secundária Tardia' },
  // Pampa
  { nome_popular: 'Açoita-cavalo', nome_cientifico: 'Luehea divaricata', familia: 'Malvaceae', bioma: 'pampa', grupo_sucessional: 'Secundária Inicial' },
  { nome_popular: 'Branquilho', nome_cientifico: 'Sebastiania commersoniana', familia: 'Euphorbiaceae', bioma: 'pampa', grupo_sucessional: 'Secundária Inicial' },
  { nome_popular: 'Camboatá Vermelho', nome_cientifico: 'Cupania vernalis', familia: 'Sapindaceae', bioma: 'pampa', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Cincho', nome_cientifico: 'Sorocea bonplandii', familia: 'Moraceae', bioma: 'pampa', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Coronilha', nome_cientifico: 'Scutia buxifolia', familia: 'Rhamnaceae', bioma: 'pampa', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Aroeira Vermelha', nome_cientifico: 'Schinus terebinthifolia', familia: 'Anacardiaceae', bioma: 'pampa', grupo_sucessional: 'Pioneira' },
  { nome_popular: 'Timbaúva', nome_cientifico: 'Enterolobium contortisiliquum', familia: 'Fabaceae', bioma: 'pampa', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Ingá do Pampa', nome_cientifico: 'Inga vera', familia: 'Fabaceae', bioma: 'pampa', grupo_sucessional: 'Pioneira' },
  { nome_popular: 'Espinilho', nome_cientifico: 'Vachellia caven', familia: 'Fabaceae', bioma: 'pampa', grupo_sucessional: 'Pioneira' },
  { nome_popular: 'Pitangueira', nome_cientifico: 'Eugenia uniflora', familia: 'Myrtaceae', bioma: 'pampa', grupo_sucessional: 'Secundária Inicial' },
  { nome_popular: 'Butiá', nome_cientifico: 'Butia odorata', familia: 'Arecaceae', bioma: 'pampa', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Canela Guaicá', nome_cientifico: 'Ocotea puberula', familia: 'Lauraceae', bioma: 'pampa', grupo_sucessional: 'Secundária Inicial' },
  { nome_popular: 'Angico Vermelho', nome_cientifico: 'Parapiptadenia rigida', familia: 'Fabaceae', bioma: 'pampa', grupo_sucessional: 'Secundária Inicial' },
  // Pantanal
  { nome_popular: 'Paratudo', nome_cientifico: 'Tabebuia aurea', familia: 'Bignoniaceae', bioma: 'pantanal', grupo_sucessional: 'Secundária Inicial' },
  { nome_popular: 'Bocaiuva', nome_cientifico: 'Acrocomia aculeata', familia: 'Arecaceae', bioma: 'pantanal', grupo_sucessional: 'Pioneira' },
  { nome_popular: 'Carandá', nome_cientifico: 'Copernicia alba', familia: 'Arecaceae', bioma: 'pantanal', grupo_sucessional: 'Secundária Inicial' },
  { nome_popular: 'Cambará', nome_cientifico: 'Vochysia divergens', familia: 'Vochysiaceae', bioma: 'pantanal', grupo_sucessional: 'Pioneira' },
  { nome_popular: 'Piúva', nome_cientifico: 'Handroanthus impetiginosus', familia: 'Bignoniaceae', bioma: 'pantanal', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Angico do Pantanal', nome_cientifico: 'Anadenanthera colubrina', familia: 'Fabaceae', bioma: 'pantanal', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Figueira', nome_cientifico: 'Ficus guaranitica', familia: 'Moraceae', bioma: 'pantanal', grupo_sucessional: 'Secundária Inicial' },
  { nome_popular: 'Ximbuva', nome_cientifico: 'Enterolobium contortisiliquum', familia: 'Fabaceae', bioma: 'pantanal', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Landi', nome_cientifico: 'Calophyllum brasiliense', familia: 'Calophyllaceae', bioma: 'pantanal', grupo_sucessional: 'Secundária Tardia' },
  { nome_popular: 'Figueira do Pantanal', nome_cientifico: 'Ficus pertusa', familia: 'Moraceae', bioma: 'pantanal', grupo_sucessional: 'Secundária Inicial' },
  { nome_popular: 'Tarumã', nome_cientifico: 'Vitex cymosa', familia: 'Lamiaceae', bioma: 'pantanal', grupo_sucessional: 'Secundária Inicial' },
];

const ESTADOS_BIOMA: Record<string, string> = {
  AC: 'amazonia', AL: 'caatinga', AM: 'amazonia', AP: 'amazonia',
  BA: 'caatinga', CE: 'caatinga', DF: 'cerrado', ES: 'mata_atlantica',
  GO: 'cerrado', MA: 'cerrado', MG: 'mata_atlantica', MS: 'pantanal',
  MT: 'cerrado', PA: 'amazonia', PB: 'caatinga', PE: 'caatinga',
  PI: 'caatinga', PR: 'mata_atlantica', RJ: 'mata_atlantica', RN: 'caatinga',
  RO: 'amazonia', RR: 'amazonia', RS: 'pampa', SC: 'mata_atlantica',
  SE: 'caatinga', SP: 'mata_atlantica', TO: 'cerrado',
};

export const BIOMA_LABEL: Record<string, string> = {
  amazonia: 'Amazônia', cerrado: 'Cerrado', mata_atlantica: 'Mata Atlântica',
  caatinga: 'Caatinga', pampa: 'Pampa', pantanal: 'Pantanal',
};

const ESTADOS = Object.keys(ESTADOS_BIOMA).sort();

// Fuzzy match: normalize accents, lowercase, check if query terms appear in target
function fuzzyMatch(query: string, target: string): boolean {
  const normalize = (s: string) =>
    s.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[-_]/g, ' ');
  const q = normalize(query);
  const t = normalize(target);
  // Each word in query must appear in target
  return q.split(' ').filter(Boolean).every(word => t.includes(word));
}

export default function Especies() {
  const [estado, setEstado] = useState('');
  const [busca, setBusca] = useState('');

  const bioma = estado ? ESTADOS_BIOMA[estado] : null;

  const resultados = useMemo(() => {
    let lista = BANCO_ESPECIES;
    if (bioma) lista = lista.filter(e => e.bioma === bioma);
    if (busca.trim()) {
      lista = lista.filter(e =>
        fuzzyMatch(busca, e.nome_popular) ||
        fuzzyMatch(busca, e.nome_cientifico) ||
        fuzzyMatch(busca, e.familia)
      );
    }
    return lista.sort((a, b) => a.nome_popular.localeCompare(b.nome_popular, 'pt-BR'));
  }, [bioma, busca]);

  const handleDownload = () => {
    if (!estado) return;
    const lista = BANCO_ESPECIES.filter(e => e.bioma === bioma);
    const header = ['Nome Popular', 'Nome Científico', 'Família', 'Bioma', 'Grupo Sucessional'];
    const rows = lista.map(e => [
      e.nome_popular, e.nome_cientifico, e.familia,
      BIOMA_LABEL[e.bioma] ?? e.bioma, e.grupo_sucessional,
    ]);
    const csv = [header, ...rows]
      .map(r => r.map(c => `"${c}"`).join(';'))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `especies_${estado}_AMBISAFE.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Leaf className="w-6 h-6 text-[#00420d]" />
          Banco de Espécies
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Consulte espécies florestais por estado e bioma — dados dos Inventários Florestais Nacionais
        </p>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm mb-6">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Estado</label>
              <Select value={estado} onValueChange={setEstado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o estado" />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS.map(uf => (
                    <SelectItem key={uf} value={uf}>
                      {uf} — {BIOMA_LABEL[ESTADOS_BIOMA[uf]] ?? ESTADOS_BIOMA[uf]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Buscar espécie</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Ex: Aroeira, Angico, Ipê..."
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                className="gap-2 border-[#00420d] text-[#00420d] hover:bg-[#00420d]/5"
                onClick={handleDownload}
                disabled={!estado}
                title={!estado ? 'Selecione um estado primeiro' : ''}
              >
                <Download className="w-4 h-4" />
                Baixar CSV
              </Button>
            </div>
          </div>
          {bioma && (
            <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              Exibindo espécies do bioma <strong>{BIOMA_LABEL[bioma]}</strong> (Estado: {estado})
            </p>
          )}
        </CardContent>
      </Card>

      {/* Results table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>
              {resultados.length} espécie{resultados.length !== 1 ? 's' : ''} encontrada{resultados.length !== 1 ? 's' : ''}
            </span>
            {!estado && (
              <span className="text-xs font-normal text-gray-400">Selecione um estado para filtrar por bioma</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#00420d] text-white">
                <tr>
                  <th className="py-3 px-4 text-left font-semibold">Nome Popular</th>
                  <th className="py-3 px-4 text-left font-semibold">Nome Científico</th>
                  <th className="py-3 px-4 text-left font-semibold">Família</th>
                  <th className="py-3 px-4 text-left font-semibold">Bioma Principal</th>
                  <th className="py-3 px-4 text-left font-semibold">Grupo Sucessional</th>
                </tr>
              </thead>
              <tbody>
                {resultados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-400">
                      <Leaf className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">
                        {busca ? 'Nenhuma espécie encontrada para esta busca.' : 'Selecione um estado ou busque uma espécie.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  resultados.map((esp, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'}>
                      <td className="py-3 px-4 font-medium text-gray-900">{esp.nome_popular}</td>
                      <td className="py-3 px-4 italic text-gray-500">{esp.nome_cientifico}</td>
                      <td className="py-3 px-4 text-gray-600">{esp.familia}</td>
                      <td className="py-3 px-4">
                        <span className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                          {BIOMA_LABEL[esp.bioma] ?? esp.bioma}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          esp.grupo_sucessional === 'Pioneira'
                            ? 'bg-yellow-50 text-yellow-700'
                            : esp.grupo_sucessional === 'Secundária Inicial'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-purple-50 text-purple-700'
                        }`}>
                          {esp.grupo_sucessional}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 text-center py-4 border-t">
            Fonte: Serviço Florestal Brasileiro — Inventário Florestal Nacional (SNIF)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
