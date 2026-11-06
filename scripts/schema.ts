// Gera viagens/viagem.schema.json a partir de src/formato/viagem.ts (para agentes de IA e editores)
import { writeFileSync } from 'node:fs';
import { z } from 'zod';
import { Viagem } from '../src/formato/viagem';

const schema = z.toJSONSchema(Viagem, { io: 'input', unrepresentable: 'any' });
writeFileSync('viagens/viagem.schema.json', JSON.stringify({ title: 'Viagem (formato 1)', ...schema }, null, 2) + '\n');
console.log('viagens/viagem.schema.json atualizado');
