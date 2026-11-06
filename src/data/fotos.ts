// Fotos dos locais que vêm com o app (public/fotos/<id>.webp, 720×480, comprimidas).
// Wikimedia Commons (licenças CC exigem o crédito ao autor), exceto a do hotel (Tripadvisor).
// Onde não há foto livre do próprio local, a imagem é ilustrativa (café, Onix, feijoada, estrada).
export interface FotoLocal { autor: string; licenca: string; fonte: string }

const commons = (arquivo: string) => `https://commons.wikimedia.org/wiki/File:${arquivo.replace(/ /g, '_')}`;

export const FOTOS: Record<string, FotoLocal> = {
  s1: { autor: 'nwerneck', licenca: 'CC BY 3.0', fonte: commons('Pao de queijo com cafe.jpg') },
  s2: { autor: 'Just a Man', licenca: 'CC BY 4.0', fonte: commons('2023 Chevrolet Onix 1.2 Ecotec MT.jpg') },
  s3: { autor: 'Marcos Jerlich', licenca: 'CC BY-SA 4.0', fonte: commons('Moinho Povos Unidos.jpg') },
  s4: { autor: 'Tania Parejo', licenca: 'CC BY-SA 4.0', fonte: commons('Centro em Holambra.jpg') },
  s5: { autor: 'Tania Parejo', licenca: 'CC BY-SA 4.0', fonte: commons('Fonte em Holambra.jpg') },
  s6: { autor: 'Bradleyzm', licenca: 'CC BY-SA 4.0', fonte: commons('Feijoada à brasileira -02.jpg') },
  s7: { autor: 'Tania Parejo', licenca: 'CC BY-SA 4.0', fonte: commons('Centro Holambra.jpg') },
  s8: { autor: 'Royal Tulip Holambra', licenca: 'Tripadvisor', fonte: 'https://media-cdn.tripadvisor.com/media/photo-s/25/dc/b9/6b/piscina-externa-adulto.jpg' },
  d1: { autor: 'Matt @ PEK', licenca: 'CC BY-SA 2.0', fonte: commons('In suite breakfast experience (3119861609).jpg') },
  d2: { autor: 'Tania Parejo', licenca: 'CC BY-SA 4.0', fonte: commons('Flores Holambra.jpg') },
  d3: { autor: 'Isack Ryuji Minowa', licenca: 'CC BY-SA 3.0', fonte: commons('Lago - 2011-10-01 - Isack - panoramio.jpg') },
  d4: { autor: 'Arjen van Reeven', licenca: 'CC BY 2.0', fonte: commons('GirassolHolambra.jpg') },
  d5: { autor: 'Felipeattilio', licenca: 'CC BY-SA 3.0', fonte: commons('Rodovia-dos-Bandeirantes-sentido-Capital-Interior.JPG') },
};

export const fotoPadrao = (id: string) => (FOTOS[id] ? `fotos/${id}.webp` : undefined);
