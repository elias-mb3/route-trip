import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { lerArquivo } from '../viagens/repositorio';

// Camada de tiles lida do pacote da viagem (IndexedDB, cifrado). Tile ausente fica transparente
// e mostra o fundo neutro do mapa.
export default function TileLayerIDB({ viagemId, bounds, maxNativeZoom }: { viagemId: string; bounds?: L.LatLngBounds; maxNativeZoom: number }) {
  const map = useMap();
  useEffect(() => {
    const Camada = L.GridLayer.extend({
      createTile(c: L.Coords, done: L.DoneCallback) {
        const img = document.createElement('img');
        img.alt = '';
        lerArquivo(viagemId, `tiles/${c.z}/${c.x}/${c.y}.png`).then((b) => {
          if (!b) return done(undefined, img);
          const url = URL.createObjectURL(b);
          img.onload = () => { URL.revokeObjectURL(url); done(undefined, img); };
          img.onerror = () => { URL.revokeObjectURL(url); done(undefined, img); };
          img.src = url;
        }, () => done(undefined, img));
        return img;
      },
    });
    const camada: L.GridLayer = new (Camada as unknown as new (o: L.GridLayerOptions) => L.GridLayer)({
      bounds, maxNativeZoom, keepBuffer: 8, attribution: '© OpenStreetMap',
    });
    camada.addTo(map);
    return () => { camada.remove(); };
  }, [map, viagemId, bounds, maxNativeZoom]);
  return null;
}
